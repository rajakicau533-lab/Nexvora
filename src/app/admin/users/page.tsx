
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldX,
  Crown,
  Star,
  AlertCircle
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
  addDoc,
  getDocs,
  where,
  writeBatch,
  deleteDoc,
  runTransaction
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
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "unverified" | "premium">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [coinAction, setCoinAction] = useState<"add" | "sub" | null>(null)
  const [coinAmount, setCoinAmount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const adminProfileRef = React.useMemo(() => (db && currentUser?.uid ? doc(db, "admins", currentUser.uid) : null), [db, currentUser?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  
  const isMaster = adminData?.role === 'super_admin' || currentUser?.email === 'adheprogramer@gmail.com';

  const usersQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "users"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: users, loading } = useCollection<any>(usersQuery)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const filteredUsers = React.useMemo(() => {
    if (!users) return []
    return users.filter(u => {
      const matchesSearch = u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (statusFilter === 'verified') matchesFilter = u.adminVerified === true;
      else if (statusFilter === 'unverified') matchesFilter = u.adminVerified === false || !u.adminVerified;
      else if (statusFilter === 'premium') matchesFilter = u.premiumBadge === true;

      return matchesSearch && matchesFilter;
    })
  }, [users, searchTerm, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  const handleUpdateCoins = async () => {
    if (!db || !selectedUser || !coinAction || !currentUser) return
    setIsProcessing(true)

    const amount = coinAction === "add" ? coinAmount : -coinAmount
    const isAdding = amount > 0;
    
    const userRef = doc(db, "users", selectedUser.uid)
    const adminRef = doc(db, "admins", currentUser.uid)

    try {
      await runTransaction(db, async (transaction) => {
        const adminDoc = await transaction.get(adminRef);
        const targetUserDoc = await transaction.get(userRef);

        if (!adminDoc.exists()) throw new Error("Profil admin Anda tidak ditemukan.");
        if (!targetUserDoc.exists()) throw new Error("User tidak ditemukan.");

        // 1. Validasi Saldo untuk Sub Admin
        if (!isMaster && isAdding) {
          const currentAdminBalance = adminDoc.data()?.coins || 0;
          if (currentAdminBalance < coinAmount) {
            throw new Error("Saldo koin Sub Admin tidak mencukupi untuk transaksi ini.");
          }
          // Kurangi saldo Sub Admin
          transaction.update(adminRef, { coins: increment(-coinAmount) });
        }

        // 2. Tambah/Kurang Saldo User
        transaction.update(userRef, { 
          coins: increment(amount),
          updatedAt: serverTimestamp()
        });

        // 3. Log Transaksi Koin User
        const coinTxRef = doc(collection(db, "coin_transactions"));
        transaction.set(coinTxRef, {
          userId: selectedUser.uid,
          amount: amount,
          type: isAdding ? "topup" : "purchase",
          description: `Admin Adjustment: ${currentUser?.email}`,
          createdAt: serverTimestamp()
        });

        // 4. Log Aktivitas Admin
        const logRef = doc(collection(db, "activity_logs"));
        const logData: any = {
          type: "admin",
          action: isAdding ? "SUB_ADMIN_ADD_COINS" : "SUB_ADMIN_SUB_COINS",
          userId: currentUser.uid,
          userEmail: currentUser.email,
          targetUser: selectedUser.email,
          targetUserId: selectedUser.uid,
          amount: Math.abs(amount),
          timestamp: serverTimestamp()
        };

        if (!isMaster) {
          logData.subAdminBalanceBefore = adminDoc.data()?.coins || 0;
          logData.subAdminBalanceAfter = (adminDoc.data()?.coins || 0) - (isAdding ? coinAmount : 0);
        }

        transaction.set(logRef, logData);
      });

      toast({ title: "Saldo Berhasil Diperbarui" })
      setCoinAction(null);
      setSelectedUser(null);
      setCoinAmount(0);
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Transaksi Gagal", 
        description: err.message 
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const toggleAdminVerify = async (user: any) => {
    if (!db || !currentUser) return;
    const currentStatus = user.adminVerified ?? false;
    const userRef = doc(db, "users", user.uid);
    
    await updateDoc(userRef, { adminVerified: !currentStatus, updatedAt: serverTimestamp() });
    
    await addDoc(collection(db, "activity_logs"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      action: "VERIFY_ACCOUNT",
      details: `${!currentStatus ? 'Verified' : 'Unverified'} user ${user.email}`,
      timestamp: serverTimestamp()
    });

    toast({ title: !currentStatus ? "User Diverifikasi" : "Verifikasi Dicabut" });
  }

  const togglePremiumBadge = async (user: any) => {
    if (!db || !currentUser) return;
    const currentStatus = user.premiumBadge ?? false;
    const userRef = doc(db, "users", user.uid);
    
    await updateDoc(userRef, { premiumBadge: !currentStatus, updatedAt: serverTimestamp() });
    
    await addDoc(collection(db, "activity_logs"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      action: "GRANT_PREMIUM",
      details: `${!currentStatus ? 'Granted' : 'Revoked'} premium for ${user.email}`,
      timestamp: serverTimestamp()
    });

    toast({ title: !currentStatus ? "Lencana Premium Diberikan" : "Lencana Premium Dicabut" });
  }

  const handleDeleteUser = async (userToDelete: any) => {
    if (!db || !isMaster || !currentUser) return;
    if (!confirm(`Hapus permanen ${userToDelete.username}? Tindakan ini tidak dapat dibatalkan.`)) return
    
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "users", userToDelete.uid));
      
      await addDoc(collection(db, "activity_logs"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        action: "DELETE_USER",
        details: `Permanently deleted user ${userToDelete.email}`,
        timestamp: serverTimestamp()
      });

      toast({ title: "User Berhasil Dihapus" });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white">Manage Users</h2>
          <p className="text-muted-foreground">Monitor and manage Nexvora members.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-black/40 border border-white/10 p-1 rounded-xl">
             {['all', 'verified', 'unverified', 'premium'].map((f) => (
               <button key={f} onClick={() => setStatusFilter(f as any)}
                 className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                   statusFilter === f ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                 )}
               >
                 {f}
               </button>
             ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/10 rounded-xl h-10" />
          </div>
        </div>
      </div>

      <Card className="premium-card rounded-[2rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">User / Email</TableHead>
              <TableHead className="text-white font-bold">Balance</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-white font-bold">Role</TableHead>
              <TableHead className="text-right text-white font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : (
              paginatedUsers.map((u) => (
                <TableRow key={u.uid} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{u.username}</span>
                        {u.premiumBadge && <Crown className="h-3 w-3 text-amber-500" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 text-primary font-black px-3">
                      {u.coins?.toLocaleString() || 0} 🪙
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.adminVerified ? <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase">Verified</Badge> : <Badge className="bg-red-500/10 text-red-500 border-none text-[9px] font-black uppercase">Pending</Badge>}
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-black uppercase text-white/40">{u.role}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-white/10 text-white rounded-xl backdrop-blur-xl">
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
                        <DropdownMenuItem onClick={() => togglePremiumBadge(u)} className="flex items-center gap-2 cursor-pointer">
                           <Star className={cn("h-4 w-4", u.premiumBadge ? "text-slate-400" : "text-amber-400")} />
                           {u.premiumBadge ? 'Remove Premium' : 'Grant Premium'}
                        </DropdownMenuItem>
                        {isMaster && (
                          <>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={() => handleDeleteUser(u)} className="flex items-center gap-2 text-red-500 cursor-pointer">
                              <Trash2 className="h-4 w-4" /> Delete Permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-white/5">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-white/10 h-10 px-4"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-white/10 h-10 px-4"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!coinAction} onOpenChange={(open) => { if (!open) setCoinAction(null); }}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <Coins className={cn("h-6 w-6", coinAction === 'add' ? 'text-green-500' : 'text-red-500')} />
              {coinAction === 'add' ? 'Tambah Koin' : 'Kurangi Koin'}
            </DialogTitle>
            <DialogDescription>User: <span className="text-white font-bold">{selectedUser?.username}</span></DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jumlah Koin</Label>
              <Input type="number" value={coinAmount} onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10 h-14 text-2xl font-bold rounded-2xl" />
            </div>
            {!isMaster && coinAction === 'add' && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                 <AlertCircle className="h-4 w-4 text-primary" />
                 <p className="text-[10px] text-white/70 font-medium">Saldo Anda akan dipotong sesuai jumlah koin yang diberikan.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" disabled={isProcessing} onClick={() => setCoinAction(null)}>Batal</Button>
            <Button onClick={handleUpdateCoins} disabled={isProcessing || coinAmount <= 0} className={cn("rounded-xl px-8 font-bold", coinAction === 'add' ? "bg-green-600" : "bg-red-600")}>
              {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
