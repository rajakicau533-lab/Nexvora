"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingBag, Plus, Trash2, Loader2, ImageIcon, Link as LinkIcon, Coins } from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, orderBy, query } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function AdminMarketplaceManagementPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceCoins: 0,
    imageUrl: "",
    downloadUrl: ""
  })
  const [isAdding, setIsAdding] = useState(false)

  // Auth check
  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isAssistant = adminData?.role === 'assistant_admin';

  const productsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "marketplace_products"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: products, loading } = useCollection<any>(productsQuery)

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || isAssistant) return
    setIsAdding(true)
    try {
      await addDoc(collection(db, "marketplace_products"), {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user?.email
      })
      toast({ title: "Produk Berhasil Ditambahkan", description: "Produk sekarang tersedia di Marketplace user." })
      setFormData({ name: "", description: "", priceCoins: 0, imageUrl: "", downloadUrl: "" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!db || isAssistant) return
    if (!confirm("Hapus produk ini dari katalog?")) return
    try {
      await deleteDoc(doc(db, "marketplace_products", id))
      toast({ title: "Produk Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-white">Marketplace Catalog 🛍️</h2>
        <p className="text-muted-foreground">Manage digital products and pricing.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {!isAssistant && (
          <div className="lg:col-span-5">
            <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Add Marketplace Product
                </CardTitle>
                <CardDescription>Fill in details for the new digital asset.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Nama Produk</Label>
                    <Input 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Harga (Koin)</Label>
                    <Input 
                      required 
                      type="number"
                      value={formData.priceCoins}
                      onChange={(e) => setFormData({...formData, priceCoins: parseInt(e.target.value) || 0})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Deskripsi</Label>
                    <Textarea 
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Preview Image URL</Label>
                    <Input 
                      placeholder="https://..." 
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Download/Access Link</Label>
                    <Input 
                      required 
                      placeholder="G-Drive / Mega Link" 
                      value={formData.downloadUrl}
                      onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-xl luxury-gradient font-bold mt-4 shadow-lg shadow-primary/20">
                    {isAdding ? <Loader2 className="animate-spin" /> : "List Product Now"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={cn("space-y-6", isAssistant ? "lg:col-span-12" : "lg:col-span-7")}>
          <div className="grid gap-6">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : products?.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground italic bg-white/5 rounded-[2rem] border border-dashed border-white/10">Catalog is empty.</div>
            ) : (
              products?.map((p) => (
                <Card key={p.id} className="premium-card rounded-3xl overflow-hidden border-white/5 bg-black/40 flex flex-col md:flex-row">
                   <div className="md:w-32 relative h-32 md:h-auto bg-white/5">
                      <img src={p.imageUrl || "https://picsum.photos/seed/product/400/400"} className="w-full h-full object-cover opacity-60" alt={p.name} />
                      <div className="absolute top-2 left-2"><Badge className="bg-primary text-[10px]">{p.priceCoins} 🪙</Badge></div>
                   </div>
                   <div className="flex-1 p-5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-white">{p.name}</CardTitle>
                          {!isAssistant && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground uppercase font-black">
                         <span>Created: {new Date(p.createdAt?.toDate()).toLocaleDateString()}</span>
                         <span className="text-primary truncate max-w-[150px]">{p.downloadUrl}</span>
                      </div>
                   </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
