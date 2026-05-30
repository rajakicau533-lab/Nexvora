"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, ExternalLink, Trash2, Loader2, PlayCircle } from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, orderBy, query } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function AdminMaterialsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    contentUrl: ""
  })
  const [isAdding, setIsAdding] = useState(false)

  // Auth check
  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isAssistant = adminData?.role === 'assistant_admin';

  const materialsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "materials"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: materials, loading } = useCollection<any>(materialsQuery)

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || isAssistant) return
    setIsAdding(true)
    try {
      await addDoc(collection(db, "materials"), {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user?.email
      })
      toast({ title: "Materi Ditambahkan", description: "Materi belajar sekarang tersedia untuk semua user." })
      setFormData({ title: "", description: "", thumbnailUrl: "", contentUrl: "" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!db || isAssistant) return
    if (!confirm("Hapus materi ini?")) return
    try {
      await deleteDoc(doc(db, "materials", id))
      toast({ title: "Materi Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-white">Learning Materials</h2>
        <p className="text-muted-foreground">Upload educational content for Nexvora members.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {!isAssistant && (
          <div className="lg:col-span-5">
            <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" /> Create New Material
                </CardTitle>
                <CardDescription>Fill in the details to publish a new lesson.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMaterial} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Judul Materi</Label>
                    <Input 
                      required 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Deskripsi Singkat</Label>
                    <Textarea 
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Thumbnail URL (Img)</Label>
                    <Input 
                      placeholder="https://images.unsplash.com/..." 
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Content/Link Video URL</Label>
                    <Input 
                      required 
                      placeholder="https://youtube.com/..." 
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({...formData, contentUrl: e.target.value})}
                      className="bg-white/5 border-white/10 rounded-xl"
                    />
                  </div>
                  <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-xl luxury-gradient font-bold mt-4">
                    {isAdding ? <Loader2 className="animate-spin" /> : "Publish Material"}
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
            ) : materials?.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground italic bg-white/5 rounded-[2rem] border border-dashed border-white/10">No materials published yet.</div>
            ) : (
              materials?.map((m) => (
                <Card key={m.id} className="premium-card rounded-3xl overflow-hidden border-white/5 bg-black/40 flex flex-col md:flex-row">
                   <div className="md:w-32 relative h-32 md:h-auto bg-white/5">
                      <img src={m.thumbnailUrl || "https://picsum.photos/seed/material/400/400"} className="w-full h-full object-cover opacity-60" alt={m.title} />
                      <div className="absolute inset-0 flex items-center justify-center"><PlayCircle className="h-8 w-8 text-white/40" /></div>
                   </div>
                   <div className="flex-1 p-5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-white">{m.title}</CardTitle>
                          {!isAssistant && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                         <Badge variant="outline" className="text-[9px] border-white/10 text-muted-foreground uppercase">{new Date(m.createdAt?.toDate()).toLocaleDateString()}</Badge>
                         <Button asChild variant="link" size="sm" className="text-primary font-black uppercase text-xs">
                           <a href={m.contentUrl} target="_blank" rel="noopener noreferrer">View Content <ExternalLink className="ml-1 h-3 w-3" /></a>
                         </Button>
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