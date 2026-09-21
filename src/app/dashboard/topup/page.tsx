"use client"

import React, { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Landmark, Upload, History, AlertCircle, Loader2, CheckCircle2, Clock, X, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, addDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

const COIN_PRICE = 3000;

export default function TopUpPage() {
  const [amount, setAmount] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [proofImage, setProofImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const totalPrice = amount * COIN_PRICE

  // Fetch riwayat top-up user
  const historyQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "topup_requests"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: history, loading: historyLoading } = useCollection<any>(historyQuery)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match('image.*')) {
        toast({ variant: "destructive", title: "Format Salah", description: "Hanya file gambar (JPG, PNG) yang diizinkan." })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran adalah 5MB." })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setProofImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !user?.uid) return
    if (!proofImage) {
      toast({ variant: "destructive", title: "Bukti Wajib", description: "Silakan upload bukti transfer terlebih dahulu." })
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "topup_requests"), {
        userId: user.uid,
        userEmail: user.email,
        amountCoins: amount,
        idrAmount: totalPrice,
        status: "pending",
        method: "manual",
        proofUrl: proofImage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      toast({ title: "Konfirmasi Terkirim! 🎉", description: "Admin akan memverifikasi pembayaran Anda segera." })
      setAmount(10)
      setProofImage(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold text-white">Top Up Koin 🪙</h2>
        <p className="text-muted-foreground text-sm">Akses layanan premium Nexvora dengan melakukan pengisian koin via transfer bank.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Top Up */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              <CardHeader className="p-8">
                <CardTitle className="text-white">Form Pengisian Saldo</CardTitle>
                <CardDescription>Masukkan jumlah koin dan lampirkan bukti transfer Anda.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-8">
                {/* Input Jumlah */}
                <div className="space-y-3">
                  <Label className="text-white font-black uppercase text-[10px] tracking-widest ml-1">Jumlah Koin</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="bg-white/5 border-white/10 h-16 text-2xl font-headline font-bold rounded-2xl pl-14 text-white focus:border-primary/50"
                    />
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary text-2xl">🪙</div>
                  </div>
                  <div className="flex justify-between items-center px-1">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">Harga per koin: Rp {COIN_PRICE.toLocaleString()}</p>
                     <p className="text-lg font-headline font-black text-primary">Total: Rp {totalPrice.toLocaleString()}</p>
                  </div>
                </div>

                {/* Rekening Tujuan */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
                   <div className="flex items-center gap-3">
                      <Landmark className="h-5 w-5 text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-white/70">Tujuan Transfer</span>
                   </div>
                   <div className="space-y-2 pl-8 border-l border-primary/30">
                      <p className="text-lg font-headline font-bold text-white tracking-tight">Bank BRI</p>
                      <div className="space-y-0.5">
                         <p className="text-xl font-headline font-black text-primary tracking-widest">676201000757500</p>
                         <p className="text-[10px] text-muted-foreground font-bold uppercase">A.N. THOMAS ADE PRABOWO</p>
                      </div>
                   </div>
                </div>

                {/* Upload Bukti */}
                <div className="space-y-3">
                   <Label className="text-white font-black uppercase text-[10px] tracking-widest ml-1">Upload Bukti Transfer</Label>
                   {proofImage ? (
                     <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group">
                        <img src={proofImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Button type="button" variant="destructive" size="sm" onClick={() => setProofImage(null)} className="rounded-xl font-bold">
                             <X className="h-4 w-4 mr-2" /> Ganti Gambar
                           </Button>
                        </div>
                     </div>
                   ) : (
                     <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center bg-white/[0.02] hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center justify-center"
                     >
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                           <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">Klik untuk Upload Bukti</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">JPG, PNG • MAKS 5MB</p>
                     </div>
                   )}
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !proofImage}
                  className="w-full h-16 rounded-2xl luxury-gradient border-none font-black text-xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : "KONFIRMASI PEMBAYARAN"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Info & Riwayat */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden h-fit">
            <CardHeader className="py-6 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-primary" /> Riwayat Top Up
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {historyLoading ? (
                  <div className="p-12 text-center"><Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" /></div>
                ) : !history || history.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs italic">Belum ada riwayat pengisian.</div>
                ) : (
                  history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-sm">{item.amountCoins} Koin</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black">
                          {new Date(item.createdAt?.toDate?.() || 0).toLocaleDateString()} • {item.method || 'Manual'}
                        </p>
                      </div>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase border-none px-2.5 py-1 rounded-lg",
                        item.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                        item.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                      )}>
                        {item.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
             <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-xs font-bold text-white">Panduan Pembayaran</p>
                   <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                      Verifikasi dilakukan secara manual oleh admin dalam waktu 1-24 jam. Pastikan bukti transfer yang Anda kirimkan jelas dan terbaca.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
