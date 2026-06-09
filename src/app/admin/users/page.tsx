"use client"

import React, { useState } from "react"
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
  Loader2
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, increment, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
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

export default function ManageUsersPage() {
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
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

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUpdateCoins = async () => {
    if (!db || !selectedUser || !coinAction) return
    
    if (isAssistant) {
      toast({ variant: "destructive", title: "Akses Ditolak", description: "Assistant Admin tidak memiliki hak untuk menambah/kurang koin." })
      return
    }

    setIsProcessing(true)

    try {
      const amount = coinAction === "add" ? coinAmount : -coinAmount
      const userRef = doc(db, "users", selectedUser.uid)
      
      await updateDoc(userRef, {
        coins: increment(amount)
      })

      // Log transaction history
      await addDoc(collection(db, "coin_transactions"), {
        userId: selectedUser.uid,
        amount: amount,
        type: amount > 0 ? "topup" : "purchase",
        description: `Admin Adjustment: ${amount > 0 ? 'Added' : 'Subtracted'} by ${currentUser?.email}`,
        createdAt: serverTimestamp()
      })

      // Log to System Activity
      await addDoc(collection(db, "activity_logs"), {
        type: "admin",
        action: amount > 0 ? "ADD_COINS" : "SUB_COINS",
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        details: `Adjusted ${Math.abs(amount)} coins for ${selectedUser.email}`,
        timestamp: serverTimestamp()
      })

      toast({ title: "Koin Berhasil Diperbarui", description: `${Math.abs(amount)} koin telah ${amount > 0 ? 'ditambahkan ke' : 'dikurangi dari'} ${selectedUser.username}.` })
      setCoinAction(null)
      setSelectedUser(null)
      setCoinAmount(0)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const addDoc = async (collRef: any, data: any) => {
    const newDocRef = doc(collRef);
    await setDoc(newDocRef, data);
    return newDocRef;
  }

  const toggleUserStatus = async (user: any) => {
    if (!db || isAssistant) {
       toast({ variant: "destructive", title: "Akses Ditolak" });
       return;
    }
    const newStatus = user.status === "active" ? "suspended" : "active"
    try {
      await updateDoc(doc(db, "users", user.uid), { status: newStatus })
      toast({ title: "Status Diperbarui", description: `Akun ${user.username} sekarang ${newStatus}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleDeleteUser = async (uid: string) => {
    if (!db || !isSuper) {
       toast({ variant: "destructive", title: "Akses Ditolak", description: "Hanya Super Admin yang dapat menghapus user." });
       return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus user ini secara permanen?")) return
    
    try {
      await deleteDoc(doc(db, "users", uid))
      toast({ title: "User Dihapus", description: "Data user telah dibersihkan dari Firestore." })
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
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by username or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 rounded-xl"
          />
        </div>
      </div>

      <Card className="premium-card rounded-[2rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">User</TableHead>
              <TableHead className="text-white font-bold">Balance</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-white font-bold">Joined</TableHead>
              <TableHead className="text-right text-white font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((u) => (
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
                    <Badge className={cn(
                      "text-[10px] uppercase font-black px-2",
                      u.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    )}>
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
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
      </Card>

      {/* Coin Adjustment Dialog */}
      <Dialog open={!!coinAction} onOpenChange={() => setCoinAction(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <Coins className={cn("h-6 w-6", coinAction === 'add' ? 'text-green-500' : 'text-red-500')} />
              {coinAction === 'add' ? 'Tambah Koin User' : 'Kurangi Koin User'}
            </DialogTitle>
            <DialogDescription>
              User: <span className="text-white font-bold">{selectedUser?.username}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Jumlah Koin</Label>
              <Input 
                type="number" 
                value={coinAmount} 
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                className="bg-white/5 border-white/10 h-14 text-2xl font-bold rounded-2xl"
              />
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground italic">Perubahan akan dicatat dalam riwayat transaksi user dan log aktivitas sistem secara otomatis.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCoinAction(null)} className="rounded-xl">Batal</Button>
            <Button 
              onClick={handleUpdateCoins} 
              disabled={isProcessing || coinAmount <= 0}
              className={cn(
                "rounded-xl px-8 font-bold",
                coinAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isProcessing ? "Processing..." : "Confirm Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
