"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Trash2, ShieldAlert, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function AdminManagementPage() {
  const { user: currentUser } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [newAdmin, setNewAdmin] = useState({
    uid: "",
    email: "",
    role: "assistant_admin" as "super_admin" | "assistant_admin"
  })
  const [isAdding, setIsAdding] = useState(false)

  // Verify Super Admin status
  const superAdminRef = React.useMemo(() => {
    if (!db || !currentUser?.uid) return null;
    return doc(db, 'admins', currentUser.uid);
  }, [db, currentUser?.uid]);
  const { data: currentAdminData, loading: adminCheckLoading } = useDoc(superAdminRef);

  const adminsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "admins"), orderBy("role", "asc"))
  }, [db])
  const { data: adminList, loading: listLoading } = useCollection<any>(adminsQuery)

  if (adminCheckLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
  
  // Master email bypass check
  const isSuper = currentAdminData?.role === 'super_admin' || currentUser?.email === 'adheprogramer@gmail.com';

  if (!isSuper) {
    return (
      <Card className="premium-card p-20 text-center border-red-500/20 bg-red-500/5 rounded-[2.5rem]">
        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-headline font-bold text-white mb-2">Akses Dibatasi</h3>
        <p className="text-muted-foreground">Hanya Super Admin yang dapat mengelola tim administrator.</p>
        <Button onClick={() => router.push("/admin")} className="mt-8 rounded-xl bg-white/5 border border-white/10">Kembali</Button>
      </Card>
    )
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !newAdmin.uid) return
    setIsAdding(true)
    try {
      await setDoc(doc(db, "admins", newAdmin.uid), {
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: serverTimestamp()
      })
      toast({ title: "Admin Berhasil Ditambahkan", description: `${newAdmin.email} sekarang memiliki akses ${newAdmin.role}.` })
      setNewAdmin({ uid: "", email: "", role: "assistant_admin" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteAdmin = async (uid: string) => {
    if (!db) return
    if (uid === currentUser?.uid) {
      toast({ variant: "destructive", title: "Action Forbidden", description: "Anda tidak dapat menghapus akun Anda sendiri." })
      return
    }
    if (!confirm("Hapus akses admin untuk user ini?")) return
    try {
      await deleteDoc(doc(db, "admins", uid))
      toast({ title: "Akses Admin Dicabut" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-white">Team Management</h2>
        <p className="text-muted-foreground">Manage administrative roles and privileges.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Authorize Admin
              </CardTitle>
              <CardDescription>Grant panel access to a registered user.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-muted-foreground">User UID</Label>
                  <Input 
                    required 
                    placeholder="UID from Authentication" 
                    value={newAdmin.uid}
                    onChange={(e) => setNewAdmin({...newAdmin, uid: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-muted-foreground">Admin Email</Label>
                  <Input 
                    required 
                    type="email"
                    placeholder="admin@email.com" 
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-muted-foreground">Privilege Role</Label>
                  <Select value={newAdmin.role} onValueChange={(v: any) => setNewAdmin({...newAdmin, role: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                      <SelectItem value="assistant_admin">Assistant Admin (Read Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-xl luxury-gradient font-bold mt-4 shadow-xl shadow-primary/20">
                  {isAdding ? <Loader2 className="animate-spin" /> : "Authorize Now"}
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
                  <TableHead className="text-white font-bold">Administrator</TableHead>
                  <TableHead className="text-white font-bold">Role</TableHead>
                  <TableHead className="text-white font-bold">Added On</TableHead>
                  <TableHead className="text-right text-white font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow>
                ) : adminList?.map((adm) => (
                  <TableRow key={adm.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{adm.email}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{adm.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] uppercase font-black px-2 py-0.5",
                        adm.role === 'super_admin' ? 'bg-primary' : 'bg-white/10 text-white'
                      )}>
                        {adm.role?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {adm.createdAt?.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {adm.id !== currentUser?.uid && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(adm.id)} className="text-red-500 hover:bg-red-500/10 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  )
}