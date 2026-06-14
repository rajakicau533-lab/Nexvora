"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MoreVertical, 
  Coins, 
  Trash2, 
  UserX,
  Plus,
  Minus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldX
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  deleteDoc, 
  addDoc 
} from "firebase/firestore"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 10

export default function ManageUsersPage() {
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "unverified">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [coinAction, setCoinAction] = useState<"add" | "sub" | null>(null)
  const [coinAmount, setCoinAmount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get current admin role
  const adminProfileRef = React.useMemo(() => {
    if (!db || !currentUser?.uid) return null;
    return doc(db, 'admins', currentUser.uid);
  }, [db, currentUser?.uid]);
  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);
  
  const isAssistant = adminData?.role === 'assistant_admin';
  const isSuper = adminData?.role === 'super_admin' || currentUser?.email === 'adheprogramer@gmail.com';

  const usersQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "users"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: users, loading } = useCollection<any>(usersQuery)

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const filteredUsers = React.useMemo(() => {
    if (!users) return []
    return users.filter(u => {
      const matchesSearch = u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVerify = statusFilter === 'all' || 
                           (statusFilter === 'verified' && u.emailVerified === true) ||
                           (statusFilter === 'unverified' && u.emailVerified !== true);

      return matchesSearch && matchesVerify;
    })
  }, [users, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  const handleUpdateCoins = async () => {
    if (!db || !selectedUser || !coinAction) return
    if (isAssistant) return

    setIsProcessing(true)

    try {
      const amount = coinAction === "add" ? coinAmount : -coinAmount
      const userRef = doc(db, "users", selectedUser.uid)
      
      await updateDoc(userRef, {
        coins: increment(amount)
      });

      await addDoc(collection(db, "coin_transactions"), {
        userId: selectedUser.uid,
        amount: amount,
        type: amount > 0 ? "topup" : "purchase",
        description: `Admin Adjustment by ${currentUser?.email}`,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "activity_logs"), {
        type: "admin",
        action: amount > 0 ? "ADD_COINS" : "SUB_COINS",
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        details: `Adjusted ${Math.abs(amount)} coins for ${selectedUser.email}`,
        timestamp: serverTimestamp()
      });

      toast({ title: "Koin Berhasil Diperbarui" })
      
      // Safety closure
      setCoinAction(null);
      setTimeout(() => {
        setSelectedUser(null);
        setCoinAmount(0);
        setIsProcessing(false);
        if (typeof document !== 'undefined') document.body.style.pointerEvents = 'auto';
      }, 200);

    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
      setIsProcessing(false)
    }
  }

  const toggleAdminVerify = async (user: any) => {
    if (!db || isAssistant) return;
    const currentStatus = user.adminVerified ?? false;
    try {
      await updateDoc(doc(db, "users", user.uid), { 
        adminVerified: !currentStatus,
        updatedAt: serverTimestamp()
      });
      toast({ 
        title: !currentStatus ? "User Diverifikasi" : "Verifikasi Dicabut", 
        description: `Status akses ${user.username} telah diperbarui.` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Update", description: err.message });
    }
  }

  const toggleUserStatus = async (user: any) => {
    if (!db || isAssistant) return;
    const newStatus = user.status === "active" ? "suspended" : "active"
    try {
      await updateDoc(doc(db, "users", user.uid), { status: newStatus })
      toast({ title: "Status Diperbarui", description: `Akun ${user.username} sekarang ${newStatus}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleDeleteUser = async (uid: string) => {
    if (!db || !isSuper) return;
    if (!confirm("Apakah Anda yakin ingin menghapus user ini secara permanen?")) return
    try {
      await deleteDoc(doc(db, "users", uid))
      toast({ title: "User Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white">Manage Users</h2>
          <p className="text-muted-foreground">Monitor and control Nexvora members.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl">
             {[
               { id: 'all', label: 'ALL' },
               { id: 'verified', label: 'VERIFIED' },
               { id: 'unverified', label: 'PENDING' }
             ].map((f) => (
               <button
                 key={f.id}
                 onClick={() => setStatusFilter(f.id as any)}
                 className={cn(
                   "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                   statusFilter === f.id ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                 )}
               >
                 {f.label}
               </button>
             ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search user..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 rounded-xl h-10"
            />
          </div>
        </div>
      </div>

      <Card className="premium-card rounded-[2rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">User / Email</TableHead>
              <TableHead className="text-white font-bold">Balance</TableHead>
              <TableHead className="text-white font-bold">Admin Status</TableHead>
              <TableHead className="text-white font-bold">Email Status</TableHead>
              <TableHead className="text-white font-bold">Joined</TableHead>
              <TableHead className="text-right text-white font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u) => (
                <TableRow key={u.uid} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{u.username}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 text-primary font-black px-3">
                      {u.coins?.toLocaleString() || 0} 🪙
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.adminVerified ? (
                      <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase flex w-fit items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-500 border-none text-[9px] font-black uppercase flex w-fit items-center gap-1">
                        <XCircle className="h-3 w-3" /> Not Verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[9px] uppercase font-black px-2 py-0.5",
                      u.emailVerified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                    )}>
                      {u.emailVerified ? 'VERIFIED' : 'PENDING'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground uppercase font-bold">
                    {u.createdAt?.toDate?.().toLocaleDateString() || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white rounded-xl backdrop-blur-xl">
                        {!isAssistant && (
                          <>
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setCoinAction("add"); }} className="flex items-center gap-2 cursor-pointer">
                              <Plus className="h-4 w-4 text-green-500" /> Add Koin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setCoinAction("sub"); }} className="flex items-center gap-2 cursor-pointer">
                              <Minus className="h-4 w-4 text-red-500" /> Subtract Koin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={() => toggleAdminVerify(u)} className="flex items-center gap-2 cursor-pointer">
                               {u.adminVerified ? <ShieldX className="h-4 w-4 text-red-400" /> : <ShieldCheck className="h-4 w-4 text-emerald-400" />}
                               {u.adminVerified ? 'Unverify Account' : 'Verify Account'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleUserStatus(u)} className="flex items-center gap-2 cursor-pointer">
                              <UserX className="h-4 w-4" /> {u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            </DropdownMenuItem>
                          </>
                        )}
                        {isSuper && (
                          <DropdownMenuItem onClick={() => handleDeleteUser(u.uid)} className="flex items-center gap-2 text-destructive cursor-pointer">
                            <Trash2 className="h-4 w-4" /> Delete Permanently
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 bg-white/5 border-t border-white/5">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-white/10 h-10 px-4">
                <ChevronLeft className="h-4 w-4 mr-2" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-white/10 h-10 px-4">
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Coin Adjustment Dialog */}
      <Dialog 
        open={!!coinAction} 
        onOpenChange={(open) => {
          if (isProcessing) return;
          if (!open) { setCoinAction(null); setSelectedUser(null); setCoinAmount(0); }
        }}
      >
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <Coins className={cn("h-6 w-6", coinAction === 'add' ? 'text-green-500' : 'text-red-500')} />
              {coinAction === 'add' ? 'Tambah Koin User' : 'Kurangi Koin User'}
            </DialogTitle>
            <DialogDescription>User: <span className="text-white font-bold">{selectedUser?.username}</span></DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Jumlah Koin</Label>
              <Input type="number" value={coinAmount} onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10 h-14 text-2xl font-bold rounded-2xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" disabled={isProcessing} onClick={() => setCoinAction(null)} className="rounded-xl">Batal</Button>
            <Button onClick={handleUpdateCoins} disabled={isProcessing || coinAmount <= 0} className={cn("rounded-xl px-8 font-bold", coinAction === 'add' ? "bg-green-600" : "bg-red-600")}>
              {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
