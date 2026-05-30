"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlayCircle, GraduationCap, ExternalLink, Gift, Heart, Loader2 } from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, doc, updateDoc, increment, setDoc, serverTimestamp } from "firebase/firestore"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function MaterialsPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null)
  const [giftAmount, setGiftAmount] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const materialsQuery = React.useMemo(() => {
    if (!db) return null
    return collection(db, "materials")
  }, [db])

  const { data: materials, loading } = useCollection<any>(materialsQuery)

  const handleOpenMaterial = (material: any) => {
    setSelectedMaterial(material)
    setGiftAmount(0)
  }

  const processAccess = async (withGift: boolean) => {
    if (!selectedMaterial) return

    if (withGift) {
      if (giftAmount <= 0) {
        toast({ variant: "destructive", title: "Jumlah Gift Tidak Valid", description: "Masukkan jumlah koin untuk memberi gift." })
        return
      }
      if (profile && profile.coins < giftAmount) {
        toast({ variant: "destructive", title: "Koin Tidak Cukup", description: "Saldo koin Anda tidak mencukupi untuk memberi gift ini." })
        return
      }

      setIsProcessing(true)
      try {
        // Potong koin
        await updateDoc(profileRef!, {
          coins: increment(-giftAmount)
        })

        // Log transaksi
        await setDoc(doc(collection(db!, "coin_transactions")), {
          userId: user?.uid,
          amount: -giftAmount,
          type: "purchase",
          description: `Gift Materi: ${selectedMaterial.title}`,
          createdAt: serverTimestamp()
        })

        toast({ title: "Terima Kasih! ❤️", description: `${giftAmount} koin telah dikirim sebagai dukungan.` })
      } catch (err: any) {
        toast({ variant: "destructive", title: "Gagal Mengirim Gift", description: err.message })
        setIsProcessing(false)
        return
      }
    }

    // Buka link YouTube
    window.open(selectedMaterial.contentUrl, "_blank")
    setSelectedMaterial(null)
    setIsProcessing(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse">Menyiapkan Ruang Belajar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-headline font-bold text-white">Free Materi 📚</h2>
          <p className="text-muted-foreground text-lg">Akses video edukasi eksklusif untuk meningkatkan pertumbuhan digital Anda.</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-3 backdrop-blur-xl">
           <div className="text-left leading-none">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">Saldo Koin</p>
              <p className="text-lg font-headline font-bold text-primary">{profile?.coins || 0} 🪙</p>
           </div>
        </div>
      </div>

      {!materials || materials.length === 0 ? (
        <Card className="premium-card p-20 text-center border-dashed bg-black/40 rounded-[2.5rem]">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-headline font-bold text-white mb-2">Belum Ada Materi Baru</h3>
          <p className="text-muted-foreground max-w-md mx-auto italic">
            Admin sedang merangkum materi berkualitas untuk Anda. Cek kembali nanti!
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {materials.map((item) => (
            <Card key={item.id} className="premium-card flex flex-col md:flex-row overflow-hidden rounded-[2rem] bg-black/40 group hover:translate-y-[-4px] transition-all duration-300">
              <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
                <img 
                  src={item.thumbnailUrl || "https://picsum.photos/seed/material/400/600"} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-12 w-12 text-white" />
                </div>
                <div className="absolute top-3 left-3">
                   <Badge className="bg-primary text-[9px] font-black tracking-widest uppercase">EKSKLUSIF</Badge>
                </div>
              </div>
              <div className="md:w-2/3 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl text-white leading-tight">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-3 text-sm text-muted-foreground">{item.description}</CardDescription>
                </div>
                <Button 
                  onClick={() => handleOpenMaterial(item)}
                  className="w-full md:w-fit luxury-gradient rounded-xl font-bold h-11 px-8 shadow-lg shadow-primary/20"
                >
                  Buka Materi <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Gift Support Dialog */}
      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] max-w-md">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-headline font-bold text-center">Dukung Kreator? ❤️</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground leading-relaxed">
              Materi ini disediakan gratis. Anda dapat memberikan <span className="text-white font-bold">Gift Koin</span> sukarela untuk mendukung operasional platform kami.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">Jumlah Gift (Opsional)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="0"
                  value={giftAmount || ""}
                  onChange={(e) => setGiftAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-white/5 border-white/10 h-14 text-2xl font-bold rounded-2xl pl-12 text-white focus:border-primary/50"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl">🪙</span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic mt-2">Kosongkan jika ingin lanjut tanpa gift.</p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-col sm:space-x-0">
            <Button 
              onClick={() => processAccess(true)}
              disabled={isProcessing || !giftAmount}
              className="w-full h-14 rounded-2xl luxury-gradient font-black text-lg shadow-xl shadow-primary/20"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <><Heart className="mr-2 h-5 w-5 fill-white" /> Kirim Gift & Buka</>}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => processAccess(false)}
              disabled={isProcessing}
              className="w-full h-12 rounded-2xl text-muted-foreground hover:text-white hover:bg-white/5 font-bold"
            >
              Buka Tanpa Gift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
