
"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Sparkles, 
  Search, 
  Copy, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  History as HistoryIcon,
  AlertCircle,
  Rocket
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase"
import { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction, 
  deleteDoc,
  getDocs,
  writeBatch
} from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { generateNextTitleSeo, type NexTitleSeoOutput } from "@/ai/flows/generate-nextitle-seo-flow"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export default function NexTitleSeoPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({ judul: "", bahan: "", hook: "" })
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [results, setResults] = useState<NexTitleSeoOutput | null>(null)

  // User Profile for coins
  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // History Query
  const historyQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "nextitle_history"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))
  }, [db, user?.uid])
  const { data: history, loading: historyLoading } = useCollection<any>(historyQuery)

  const loadingSteps = [
    "Menganalisis Produk...",
    "Menyusun Judul Viral...",
    "Membuat Hashtag Relevan...",
    "Menyusun Hook Promosi...",
    "Menyelesaikan Konten..."
  ]

  const handleGenerate = async () => {
    if (!db || !user?.uid || !profile) return
    if (!formData.judul || !formData.bahan || !formData.hook) {
      toast({ variant: "destructive", title: "Field Kosong", description: "Semua kolom input wajib diisi." })
      return
    }

    if (profile.coins < 1) {
      toast({ variant: "destructive", title: "Koin tidak mencukupi", description: "Minimal saldo 1 koin untuk generate." })
      return
    }

    setIsGenerating(true)
    setLoadingStep(0)
    setResults(null)

    // Simulasi visual loading step by step
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev))
    }, 1200)

    try {
      // Panggil mesin generator offline
      const result = await generateNextTitleSeo(formData)

      // Transaksi atomik untuk potong koin dan simpan riwayat
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(profileRef!)
        if (!userSnap.exists()) throw new Error("Profil user tidak ditemukan.")
        
        const currentCoins = userSnap.data().coins || 0
        if (currentCoins < 1) throw new Error("Saldo koin tidak mencukupi.")

        // Update saldo user
        transaction.update(profileRef!, { coins: currentCoins - 1 })

        // Log transaksi koin
        const txRef = doc(collection(db, "coin_transactions"));
        transaction.set(txRef, {
          userId: user.uid,
          amount: -1,
          type: "purchase",
          description: `NexTitle Pro Generate: ${formData.judul}`,
          createdAt: serverTimestamp()
        })

        // Simpan ke riwayat
        const histRef = doc(collection(db, "nextitle_history"))
        transaction.set(histRef, {
          userId: user.uid,
          username: profile.username,
          judul: formData.judul,
          bahan: formData.bahan,
          hook: formData.hook,
          captions: result.captions,
          hashtags: result.hashtags,
          hookPros: result.hookPros,
          coinUsed: 1,
          createdAt: serverTimestamp()
        })
      })

      setResults(result)
      toast({ title: "Generate Berhasil! ✨", description: "Konten SEO telah siap digunakan." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    } finally {
      clearInterval(stepInterval)
      setIsGenerating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Berhasil disalin" })
  }

  const handleDeleteCurrent = () => {
    setResults(null)
    setFormData({ judul: "", bahan: "", hook: "" })
  }

  const handleDeleteHistory = async () => {
    if (!db || !user?.uid) return
    if (!confirm("Yakin ingin menghapus riwayat?")) return

    try {
      const q = query(collection(db, "nextitle_history"), where("userId", "==", user.uid))
      const snap = await getDocs(q)
      const batch = writeBatch(db)
      snap.docs.forEach(d => batch.delete(d.ref))
      await batch.commit()
      toast({ title: "Riwayat Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Hapus", description: err.message })
    }
  }

  const handleDeleteHistoryItem = async (id: string) => {
    if (!db) return
    try {
      await deleteDoc(doc(db, "nextitle_history", id))
      toast({ title: "Item Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="text-white h-6 w-6" />
             </div>
             <h2 className="text-4xl font-headline font-bold text-white">NexTitle Pro</h2>
          </div>
          <p className="text-muted-foreground text-lg">Platform cerdas untuk optimasi SEO konten viral Anda.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-white">Saldo: {profile?.coins || 0} 🪙</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Konfigurasi SEO</CardTitle>
              <CardDescription>Masukkan detail produk untuk hasil maksimal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Judul Produk / Konten</Label>
                <Input 
                  placeholder="Contoh: Gamis Terbaru" 
                  value={formData.judul}
                  onChange={(e) => setFormData({...formData, judul: e.target.value})}
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bahan Produk / Detail</Label>
                <Input 
                  placeholder="Contoh: Katun Premium" 
                  value={formData.bahan}
                  onChange={(e) => setFormData({...formData, bahan: e.target.value})}
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hook Awal / CTA</Label>
                <Input 
                  placeholder="Contoh: Order di Keranjang Oren" 
                  value={formData.hook}
                  onChange={(e) => setFormData({...formData, hook: e.target.value})}
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-primary/50"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group"
              >
                {isGenerating ? "MENGANALISIS..." : <><Sparkles className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> GENERATE CERDAS</>}
              </Button>
            </CardContent>
          </Card>

          {isGenerating && (
            <Card className="premium-card rounded-[2rem] border-primary/20 bg-primary/5 p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-pulse" />
                  </div>
               </div>
               <div className="space-y-2">
                  <p className="text-xl font-headline font-bold text-white tracking-tight">{loadingSteps[loadingStep]}</p>
                  <p className="text-[10px] text-primary uppercase font-black tracking-widest animate-pulse">Proses Sedang Berjalan</p>
               </div>
               <Progress value={((loadingStep + 1) / loadingSteps.length) * 100} className="h-1.5 bg-white/5" />
            </Card>
          )}
        </div>

        <div className="lg:col-span-7 space-y-8">
          {results ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleDeleteCurrent} className="text-red-500 hover:bg-red-500/10 font-bold rounded-xl">
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus Hasil
                </Button>
              </div>

              {/* SECTION 1: Captions */}
              <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> 🎬 Caption Judul Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {results.captions.map((cap, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 group">
                      <p className="text-sm text-white/90 leading-relaxed"><span className="text-primary font-black mr-2">Pilihan {i+1}</span> {cap}</p>
                      <Button size="icon" variant="ghost" onClick={() => handleCopy(cap)} className="shrink-0 h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* SECTION 2: Hashtags */}
              <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" /> # Hashtag Viral
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-6">
                    <p className="text-lg font-bold text-primary tracking-wide leading-relaxed">{results.hashtags}</p>
                    <Button onClick={() => handleCopy(results.hashtags)} className="w-full h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-primary hover:text-white transition-all font-black text-xs">
                      SALIN SEMUA
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3: Hook Pro */}
              <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 overflow-hidden">
                <CardHeader className="bg-white/5 border-b border-white/5">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" /> 🚀 Hook Pro
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {results.hookPros.map((hk, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 group">
                      <p className="text-sm text-white/80 italic leading-relaxed"><span className="block text-[10px] font-black uppercase text-primary mb-2">Pilihan {i+1}</span> {hk}</p>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(hk)} className="text-xs font-bold text-primary hover:bg-primary/10">
                          <Copy className="h-3 w-3 mr-2" /> Salin Hook
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 p-20 text-center space-y-6 opacity-40">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                 <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-headline font-bold text-white">Hasil Generate SEO</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">Masukkan detail produk Anda di panel kiri untuk mulai membuat konten viral.</p>
              </div>
            </Card>
          )}

          {/* RIWAYAT GENERATE */}
          <div className="space-y-6 pt-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-primary" /> Riwayat NexTitle Pro
              </h3>
              {history && history.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleDeleteHistory} className="text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest">
                  Hapus Semua
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {historyLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
              ) : !history || history.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground italic text-xs bg-white/5 rounded-2xl border border-dashed border-white/10">Belum ada riwayat generate.</div>
              ) : (
                history.map((item) => (
                  <Card key={item.id} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden group">
                     <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                              SEO
                           </div>
                           <div>
                              <p className="text-xs font-bold text-white">{item.judul}</p>
                              <p className="text-[9px] text-muted-foreground uppercase font-black">{new Date(item.createdAt?.toDate()).toLocaleString()}</p>
                           </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteHistoryItem(item.id)} className="h-8 w-8 text-white/20 hover:text-red-500">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                     </div>
                     <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                           <div>
                              <p className="text-muted-foreground uppercase font-black mb-1">Bahan</p>
                              <p className="text-white/80 font-medium truncate">{item.bahan}</p>
                           </div>
                           <div>
                              <p className="text-muted-foreground uppercase font-black mb-1">Hook</p>
                              <p className="text-white/80 font-medium truncate">{item.hook}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <Button size="sm" variant="outline" onClick={() => setResults({ captions: item.captions, hashtags: item.hashtags, hookPros: item.hookPros })} className="h-8 text-[9px] font-black uppercase rounded-lg border-white/10 bg-white/5 flex-1">
                             Tampilkan Kembali
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
