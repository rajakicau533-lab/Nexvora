
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Trash2, Loader2, Coins, Minus, Plus, Power, PowerOff, History } from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, increment, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog"

export default function AdminManagementPage() {
  const { user: currentUser, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [newAdmin, setNewAdmin] = useState({ uid: "", email: "", role: "assistant_admin" })
  const [isAdding, setIsAdding] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
  const [coinAction, setCoinAction] = useState<"add" | "sub" | null>(null)
  const [coinAmount, setCoinAmount] = useState(0)

  // Verify Master Status
  const adminProfileRef = React.useMemo(() => (db && currentUser?.uid ? doc(db, "admins", currentUser.uid) : null), [db, currentUser?.uid]);
  const { data: adminData, loading: adminCheckLoading } = useDoc(adminProfileRef);
  
  const isMaster = adminData?.role === 'super_admin' || currentUser?.email === 'adheprogramer@gmail.com';

  const adminsQuery = React.useMemo(() => (db ? query(collection(db, "admins"), orderBy("role", "asc")) : null), [db])
  const { data: adminList, loading: listLoading } = useCollection<any>(adminsQuery)

  if (authLoading || adminCheckLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="text-muted-foreground font-headline text-[10px] uppercase tracking-widest">Verifikasi Otoritas...</p>
      </div>
    )
  }

  if (!isMaster) {
    router.push("/admin");
    return null;
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !newAdmin.uid) return
    setIsAdding(true)
    try {
      await setDoc(doc(db, "admins", newAdmin.uid), {
        email: newAdmin.email.toLowerCase().trim(),
        role: newAdmin.role,
        coins: 0,
        status: "active",
        createdAt: serverTimestamp()
      })
      
      await addDoc(collection(db, "activity_logs"), {
        type: "admin",
        action: "ADD_ADMIN",
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        details: `Menambahkan admin baru: ${newAdmin.email} dengan role ${newAdmin.role}`,
        timestamp: serverTimestamp()
      });

      toast({ title: "Sub Admin Authorized" })
      setNewAdmin({ uid: "", email: "", role: "assistant_admin" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleStatus = async (adm: any) => {
    if (!db) return
    const newStatus = adm.status === 'active' ? 'inactive' : 'active';
    await setDoc(doc(db, "admins", adm.id), { status: newStatus }, { merge: true });
    
    await addDoc(collection(db, "activity_logs"), {
      type: "admin",
      action: "TOGGLE_ADMIN_STATUS",
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
      details: `Mengubah status admin ${adm.email} menjadi ${newStatus}`,
      timestamp: serverTimestamp()
    });

    toast({ title: `Admin ${newStatus.toUpperCase()}` });
  }

  const handleUpdateCoins = async () => {
    if (!db || !selectedAdmin || !coinAction) return
    const amount = coinAction === "add" ? coinAmount : -coinAmount
    
    if (coinAction === "sub" && (selectedAdmin.coins || 0) < coinAmount) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Sub Admin tidak memiliki koin sebanyak itu." });
      return;
    }

    try {
      await setDoc(doc(db, "admins", selectedAdmin.id), { coins: increment(amount) }, { merge: true });
      
      await addDoc(collection(db, "sub_admin_coin_history"), {
        adminUid: selectedAdmin.id,
        adminEmail: selectedAdmin.email,
        amount: Math.abs(amount),
        type: coinAction,
        beforeBalance: selectedAdmin.coins || 0,
        afterBalance: (selectedAdmin.coins || 0) + amount,
        processedBy: currentUser?.email,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "activity_logs"), {
        type: "admin",
        action: coinAction === "add" ? "ADD_ADMIN_COINS" : "SUB_ADMIN_COINS",
        userId: currentUser?.uid,
        userEmail: currentUser?.email,
        details: `${currentUser?.email} ${coinAction === "add" ? "menambahkan" : "mengurangi"} ${Math.abs(amount)} koin ${coinAction === "add" ? "ke" : "dari"} ${selectedAdmin.email}`,
        timestamp: serverTimestamp()
      });

      toast({ title: "Saldo Sub Admin Diperbarui" });
      setCoinAction(null); 
      setCoinAmount(0);
      setSelectedAdmin(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-white">Admin Management</h2>
        <p className="text-muted-foreground">Manage hierarchy, roles, and sub-admin balances.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Authorize Sub Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40 ml-1">User UID</Label>
                  <Input required placeholder="Enter UID" value={newAdmin.uid} onChange={(e) => setNewAdmin({...newAdmin, uid: e.target.value})} className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Admin Email</Label>
                  <Input required type="email" placeholder="admin@nexvora.com" value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Privilege Role</Label>
                  <Select value={newAdmin.role} onValueChange={(v: any) => setNewAdmin({...newAdmin, role: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">MASTER ADMIN</SelectItem>
                      <SelectItem value="assistant_admin">SUB ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-xl luxury-gradient font-bold mt-4">
                  {isAdding ? <Loader2 className="animate-spin" /> : "GRANT ACCESS"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white font-bold">Admin</TableHead>
                  <TableHead className="text-white font-bold">Role</TableHead>
                  <TableHead className="text-white font-bold">Balance</TableHead>
                  <TableHead className="text-white font-bold">Status</TableHead>
                  <TableHead className="text-right text-white font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
                ) : adminList?.map((adm) => (
                  <TableRow key={adm.id} className="border-white/5 hover:bg-white/5">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{adm.email}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{adm.id.slice(0, 10)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[8px] font-black uppercase", adm.role === 'super_admin' ? 'bg-primary' : 'bg-white/10')}>{adm.role === 'super_admin' ? 'MASTER' : 'SUB'}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">{adm.coins || 0} 🪙</span>
                    </TableCell>
                    <TableCell>
                       <button onClick={() => handleToggleStatus(adm)} className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase", adm.status === 'active' ? 'text-green-500' : 'text-red-500')}>
                         {adm.status === 'active' ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                         {adm.status || 'active'}
                       </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {adm.role === 'assistant_admin' && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedAdmin(adm); setCoinAction("add"); }} className="h-8 w-8 text-green-500"><Plus className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedAdmin(adm); setCoinAction("sub"); }} className="h-8 w-8 text-red-500"><Minus className="h-4 w-4" /></Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { if(confirm("Hapus akses?")) deleteDoc(doc(db, "admins", adm.id)) }} className="h-8 w-8 text-white/20 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <Dialog open={!!coinAction} onOpenChange={(open) => { if (!open) { setCoinAction(null); setSelectedAdmin(null); } }}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              <Coins className={cn("h-6 w-6", coinAction === 'add' ? 'text-green-500' : 'text-red-500')} />
              {coinAction === 'add' ? 'Topup Sub Admin' : 'Potong Saldo Sub Admin'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
               <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Admin Target</p>
               <p className="font-bold text-white">{selectedAdmin?.email}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah Koin</Label>
              <Input type="number" value={coinAmount} onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10 h-14 text-2xl font-bold rounded-2xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setCoinAction(null); setSelectedAdmin(null); }}>Batal</Button>
            <Button onClick={handleUpdateCoins} disabled={coinAmount <= 0} className={cn("rounded-xl px-8 font-bold", coinAction === 'add' ? "bg-green-600" : "bg-red-600")}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
