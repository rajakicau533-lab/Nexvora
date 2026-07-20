"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Rocket, 
  Link as LinkIcon, 
  Copy, 
  Trash2, 
  Loader2, 
  ExternalLink,
  X,
  ExternalLink as OpenIcon,
  History,
  ImageIcon,
  AlertCircle
} from "lucide-react"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy, deleteDoc, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function BoostKlikPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [targetUrl, setTargetUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(null)

  // Fetch user links
  const linksQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "boostKlik"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: links, loading } = useCollection<any>(linksQuery)

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user?.uid) return
    
    if (!imageUrl.trim()) {
      toast({ variant: "destructive", title: "URL Gambar Wajib", description: "Silakan masukkan URL gambar promosi." })
      return
    }
    
    if (!targetUrl.includes("shopee.co.id") && !targetUrl.includes("shope.ee")) {
      toast({ variant: "destructive", title: "Link Tidak Valid", description: "Gunakan link produk Shopee yang benar." })
      return
    }

    setIsCreating(true)
    try {
      const shortCode = generateShortCode()
      await addDoc(collection(db, "boostKlik"), {
        uid: user.uid,
        imageUrl: imageUrl.trim(),
        targetUrl: targetUrl.trim(),
        shortCode,
        createdAt: serverTimestamp()
      })

      const fullUrl = `${window.location.origin}/boost/${shortCode}`
      setLastCreatedUrl(fullUrl)
      
      toast({ title: "Link Berhasil Dibuat! 🚀", description: "Gunakan link baru Anda untuk promosi." })
      setTargetUrl("")
      setImageUrl("")
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Membuat Link", description: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyDirect = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({ title: "Tautan Disalin! 📋" })
  }

  const handleDelete = async (id: string) => {
    if (!db) return
    if (!confirm("Hapus link boost ini?")) return
    try {
      await deleteDoc(doc(db, "boostKlik", id))
      toast({ title: "Link Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <div className="space-y-1">
        <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
          Boost Klik 🚀
        </h2>
        <p className="text-muted-foreground text-sm">Buat link landing page instan menggunakan URL gambar publik untuk meningkatkan klik Shopee Anda.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Creator Form */}
        <div className="lg:col-span-5 space-y-6">
          {lastCreatedUrl && (
            <Card className="border-primary/40 bg-primary/5 rounded-[2rem] p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-1">Link Redirect Anda</h3>
                  <Button variant="ghost" size="icon" onClick={() => setLastCreatedUrl(null)} className="h-6 w-6 text-white/20 hover:text-white">
                    <X className="h-4 w-4" />
                  </Button>
               </div>
               <div className="space-y-4">
                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-primary font-bold break-all">
                     {lastCreatedUrl}
                  </div>
                  <div className="flex gap-3">
                     <Button 
                      onClick={() => handleCopyDirect(lastCreatedUrl)}
                      className="flex-1 h-11 rounded-xl luxury-gradient font-black text-[10px] uppercase shadow-lg shadow-primary/20"
                     >
                       <Copy className="h-3.5 w-3.5 mr-2" /> Salin Link
                     </Button>
                     <Button 
                      asChild
                      variant="outline"
                      className="flex-1 h-11 rounded-xl border-white/10 bg-white/5 font-black text-[10px] uppercase"
                     >
                       <a href={lastCreatedUrl} target="_blank" rel="noopener noreferrer">
                         <OpenIcon className="h-3.5 w-3.5 mr-2" /> Buka Link
                       </a>
                     </Button>
                  </div>
               </div>
            </Card>
          )}

          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 pb-4">
               <CardTitle className="text-lg text-white">Buat Tautan Baru</CardTitle>
               <CardDescription>Masukkan URL gambar publik dan link tujuan Shopee.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
               <form onSubmit={handleCreateLink} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">URL Gambar Promosi</Label>
                    <div className="relative">
                       <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        required
                        placeholder="https://example.com/gambar.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 rounded-xl pl-12 text-sm focus:border-primary/50"
                       />
                    </div>
                    {imageUrl && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-black/20 aspect-video">
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=URL+Gambar+Tidak+Valid";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Link Shopee Produk</Label>
                    <div className="relative">
                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        required
                        placeholder="https://shopee.co.id/..."
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 rounded-xl pl-12 text-sm focus:border-primary/50"
                       />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isCreating || !imageUrl || !targetUrl}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group"
                  >
                    {isCreating ? <Loader2 className="animate-spin h-6 w-6" /> : <><Rocket className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> BUAT TAUTAN BOOST</>}
                  </Button>
               </form>
            </CardContent>
          </Card>
        </div>

        {/* Links List */}
        <div className="lg:col-span-7 space-y-6">
           <h3 className="text-xl font-headline font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Riwayat Tautan Boost
           </h3>

           {loading ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
           ) : !links || links.length === 0 ? (
             <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 p-20 text-center space-y-4 opacity-40">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                   <LinkIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground italic">Belum ada tautan boost yang dibuat.</p>
             </Card>
           ) : (
             <div className="grid gap-4">
               {links.map((link: any) => {
                 const fullLink = `${window.location.origin}/boost/${link.shortCode}`;
                 return (
                   <Card key={link.id} className="premium-card rounded-2xl bg-black/40 border-white/5 overflow-hidden group hover:border-primary/30 transition-all">
                      <div className="flex flex-col sm:flex-row items-center p-4 gap-6">
                         <div className="w-full sm:w-32 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/5">
                            <img 
                              src={link.imageUrl} 
                              className="w-full h-full object-cover" 
                              alt="Boost" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Gambar+Error";
                              }}
                            />
                         </div>
                         <div className="flex-1 space-y-2 text-center sm:text-left min-w-0 w-full">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                               <Badge className="bg-primary/20 text-primary border border-primary/20 text-[9px] font-black px-2 uppercase">{link.shortCode}</Badge>
                               <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{new Date(link.createdAt?.toDate()).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm font-bold text-white truncate max-w-full font-mono">
                               {fullLink}
                            </p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                               <Button 
                                onClick={() => handleCopyDirect(fullLink)}
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-lg text-primary hover:bg-primary/10 font-bold text-[10px] uppercase"
                               >
                                 <Copy className="h-3 w-3 mr-2" /> Salin Link
                               </Button>
                               <Button 
                                asChild
                                variant="ghost" 
                                size="sm" 
                                className="h-8 rounded-lg text-white/40 hover:bg-white/5 font-bold text-[10px] uppercase"
                               >
                                 <a href={fullLink} target="_blank" rel="noopener noreferrer">
                                   <OpenIcon className="h-3 w-3 mr-2" /> Buka
                                 </a>
                               </Button>
                               <div className="w-px h-3 bg-white/10 hidden sm:block" />
                               <a href={link.targetUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                 <ExternalLink className="h-3 w-3" /> Target Shopee
                               </a>
                            </div>
                            <div className="pt-1">
                               <p className="text-[8px] text-white/20 truncate uppercase font-bold tracking-tight">Source Image: {link.imageUrl}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(link.id)}
                              className="h-10 w-10 text-white/20 hover:text-red-500 rounded-xl"
                            >
                               <Trash2 className="h-5 w-5" />
                            </Button>
                         </div>
                      </div>
                   </Card>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
