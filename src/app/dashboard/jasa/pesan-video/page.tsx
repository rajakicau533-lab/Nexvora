
"use client"

import React, { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Clapperboard, 
  Video, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Upload, 
  X, 
  MessageCircle, 
  Landmark, 
  ArrowRight,
  Info,
  Loader2,
  FileVideo
} from "lucide-react"
import { useFirestore, useUser } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { BANK_DETAILS, CONTACT_INFO } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const CATEGORIES = [
  "Fashion",
  "Home Living",
  "Elektronik",
  "Perabot",
  "Pertanian"
]

const BASE_PRICE = 5000
const EXTRA_COST = 1000

export default function PesanVideoPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  // --- Form State ---
  const [category, setCategory] = useState("Fashion")
  const [quantity, setQuantity] = useState(5)
  const [productLinks, setProductLinks] = useState("")
  const [hasGimmick, setHasGimmick] = useState(false)
  const [hasWatermark, setHasWatermark] = useState(false)
  const [ratio, setRatio] = useState("9:16")

  // --- UI State ---
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [proofImage, setProofImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Calculations ---
  const costPerVideo = BASE_PRICE + (hasGimmick ? EXTRA_COST : 0) + (hasWatermark ? EXTRA_COST : 0)
  const totalPayment = costPerVideo * quantity

  const handleProcessOrder = () => {
    if (quantity < 5) {
      toast({ variant: "destructive", title: "Minimal Order", description: "Minimal pemesanan adalah 5 video." })
      return
    }
    if (!productLinks.trim()) {
      toast({ variant: "destructive", title: "Input Kurang", description: "Silakan masukkan link produk Anda." })
      return
    }
    setShowSummary(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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

  const handleSendToAdmin = async () => {
    if (!db || !user?.uid || !proofImage) return
    setIsProcessing(true)

    try {
      // 1. Save to Database
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        category,
        quantity,
        productLinks,
        hasGimmick,
        hasWatermark,
        ratio,
        totalPrice: totalPayment,
        status: "pending",
        proofUrl: proofImage,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, "video_orders"), orderData)

      // 2. Generate WhatsApp Message
      const message = `Halo Admin Nexvora Studio,\n\nSaya ingin memesan Jasa Video.\n\n` +
        `• Nama User: ${user.email}\n` +
        `• Kategori: ${category}\n` +
        `• Jumlah Video: ${quantity}\n` +
        `• Durasi: 10 Detik/Video\n` +
        `• Opsi Gimik: ${hasGimmick ? "DENGAN GIMIK" : "TANPA GIMIK"}\n` +
        `• Opsi Watermark: ${hasWatermark ? "DENGAN WATERMARK" : "TANPA WATERMARK"}\n` +
        `• Rasio: ${ratio}\n` +
        `• Harga per Video: Rp ${costPerVideo.toLocaleString()}\n` +
        `• Biaya Tambahan: Rp ${(costPerVideo - BASE_PRICE).toLocaleString()}/video\n` +
        `• TOTAL PEMBAYARAN: Rp ${totalPayment.toLocaleString()}\n\n` +
        `• Link Produk:\n${productLinks}\n\n` +
        `• Status Pembayaran: MENUNGGU VERIFIKASI\n\n` +
        `Saya lampirkan bukti transfer di chat ini. Mohon segera diproses. Terima kasih.`;

      const whatsappUrl = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
      
      toast({ title: "Pesanan Dikirim! 🎉", description: "Menghubungkan ke WhatsApp Admin..." })
      window.open(whatsappUrl, '_blank')
      
      // Cleanup
      setShowSummary(false)
      setProofImage(null)
      setProductLinks("")
      setQuantity(5)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Simpan", description: err.message })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl luxury-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <Clapperboard className="text-white h-6 w-6" />
             </div>
             <h2 className="text-4xl font-headline font-bold text-white tracking-tight">Pesan Video 🎬</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">Buat konten video promosi berkualitas tinggi dengan durasi 10 detik untuk produk Anda.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="p-8 md:p-10 pb-4">
                <CardTitle className="text-2xl text-white">Rincian Video</CardTitle>
                <CardDescription>Sesuaikan kebutuhan video promosi Anda di bawah ini.</CardDescription>
             </CardHeader>
             <CardContent className="p-8 md:p-10 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Kategori Produk</Label>
                      <Select value={category} onValueChange={setCategory}>
                         <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl text-white">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="bg-black/95 border-white/10 text-white">
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Jumlah Video (Min. 5)</Label>
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 h-14 rounded-2xl px-6">
                         <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(5, quantity - 1))} className="h-8 w-8 text-primary hover:bg-primary/10">
                            <Minus className="h-4 w-4" />
                         </Button>
                         <span className="flex-1 text-center text-xl font-headline font-black text-white">{quantity}</span>
                         <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)} className="h-8 w-8 text-primary hover:bg-primary/10">
                            <Plus className="h-4 w-4" />
                         </Button>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Daftar Link Produk</Label>
                   <Textarea 
                      placeholder="Masukkan link produk Anda di sini (Satu per baris)..."
                      value={productLinks}
                      onChange={(e) => setProductLinks(e.target.value)}
                      className="bg-white/5 border-white/10 min-h-[120px] rounded-2xl text-white focus:border-primary/50 text-sm"
                   />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Opsi Gimik</Label>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setHasGimmick(false)} className={cn("h-12 rounded-xl border text-[10px] font-bold uppercase transition-all", !hasGimmick ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40")}>Tanpa Gimik</button>
                         <button onClick={() => setHasGimmick(true)} className={cn("h-12 rounded-xl border text-[10px] font-bold uppercase transition-all", hasGimmick ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40")}>+ Gimik (1K)</button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Watermark Profil</Label>
                      <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setHasWatermark(false)} className={cn("h-12 rounded-xl border text-[10px] font-bold uppercase transition-all", !hasWatermark ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40")}>Tanpa WM</button>
                         <button onClick={() => setHasWatermark(true)} className={cn("h-12 rounded-xl border text-[10px] font-bold uppercase transition-all", hasWatermark ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-white/40")}>+ WM (1K)</button>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Rasio Video</Label>
                   <div className="grid grid-cols-2 gap-4">
                      {["9:16", "16:9"].map(r => (
                        <button key={r} onClick={() => setRatio(r)} className={cn("h-14 rounded-2xl border-2 font-headline font-bold text-lg flex items-center justify-center gap-3 transition-all", ratio === r ? "bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(220,38,38,0.1)]" : "bg-white/5 border-white/10 text-white/20 hover:text-white/40")}>
                           <Video className={cn("h-5 w-5", ratio === r ? "text-primary" : "text-white/20")} /> {r}
                        </button>
                      ))}
                   </div>
                </div>
             </CardContent>
             <CardFooter className="p-8 md:p-10 pt-0">
                <Button 
                   onClick={handleProcessOrder}
                   className="w-full h-16 rounded-2xl luxury-gradient border-none font-black text-xl shadow-2xl shadow-primary/30 group"
                >
                   PROSES PESANAN <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Button>
             </CardFooter>
          </Card>
        </div>

        {/* Right: Price Preview */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="premium-card rounded-3xl bg-black/60 border-white/5 overflow-hidden sticky top-24">
              <CardHeader className="border-b border-white/5">
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Info className="h-4 w-4" /> ESTIMASI HARGA
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Harga Dasar</span>
                       <span className="text-white font-bold">Rp {BASE_PRICE.toLocaleString()}</span>
                    </div>
                    {hasGimmick && (
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Biaya Gimik</span>
                          <span className="text-green-500 font-bold">+ Rp 1.000</span>
                       </div>
                    )}
                    {hasWatermark && (
                       <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Biaya Watermark</span>
                          <span className="text-green-500 font-bold">+ Rp 1.000</span>
                       </div>
                    )}
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                       <span className="text-muted-foreground">Harga per Video</span>
                       <span className="text-white font-bold">Rp {costPerVideo.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Total Pembayaran</p>
                    <p className="text-3xl font-headline font-black text-white">Rp {totalPayment.toLocaleString()}</p>
                    <p className="text-[10px] text-white/30 mt-2 font-bold uppercase">{quantity} Video • 10 Detik</p>
                 </div>

                 <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                    <p className="text-[10px] text-muted-foreground font-medium flex items-start gap-2">
                       <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                       Konten original dan berkualitas.
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-start gap-2">
                       <CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                       Penyelesaian dalam 1-3 hari kerja.
                    </p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* --- Summary & Payment Modal --- */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-8 md:p-10 max-w-lg overflow-y-auto max-h-[90vh]">
           <div className="space-y-8">
              <div className="text-center space-y-3">
                 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                    <Clapperboard className="text-primary h-8 w-8" />
                 </div>
                 <DialogTitle className="text-2xl font-headline font-bold text-white">Detail Pesanan Video</DialogTitle>
                 <DialogDescription className="text-muted-foreground text-sm">Silakan selesaikan pembayaran untuk memproses pesanan Anda.</DialogDescription>
              </div>

              {/* Order Info */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase">Kategori</span>
                    <span className="text-white font-bold">{category}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase">Total Video</span>
                    <span className="text-white font-bold">{quantity} Video</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase">Total Bayar</span>
                    <span className="text-primary font-black text-lg">Rp {totalPayment.toLocaleString()}</span>
                 </div>
              </div>

              {/* Bank Details */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-5">
                 <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Metode Pembayaran</span>
                 </div>
                 <div className="space-y-2 pl-8 border-l border-primary/30">
                    <p className="text-lg font-headline font-bold text-white tracking-tight">Bank BRI</p>
                    <div className="space-y-0.5">
                       <p className="text-xl font-headline font-black text-primary tracking-widest">{BANK_DETAILS.account_number}</p>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase">{BANK_DETAILS.account_holder}</p>
                    </div>
                 </div>
              </div>

              {/* Upload Proof */}
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Upload Bukti Transfer</Label>
                 
                 {proofImage ? (
                   <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={proofImage} alt="Bukti Transfer" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Button variant="destructive" size="sm" onClick={() => setProofImage(null)} className="rounded-xl font-bold">
                           <X className="h-4 w-4 mr-2" /> Hapus
                         </Button>
                      </div>
                   </div>
                 ) : (
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/[0.02] hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center justify-center"
                   >
                     <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                     </div>
                     <p className="text-sm font-bold text-white mb-1">Pilih Bukti Transfer</p>
                     <p className="text-[10px] text-muted-foreground uppercase font-black">JPG, PNG • MAKS 5MB</p>
                   </div>
                 )}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                 <Button 
                    onClick={handleSendToAdmin}
                    disabled={isProcessing || !proofImage}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group"
                 >
                    {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <><MessageCircle className="mr-2 h-6 w-6" /> KIRIM KE ADMIN</>}
                 </Button>
                 <Button variant="ghost" onClick={() => setShowSummary(false)} className="text-muted-foreground hover:text-white hover:bg-white/5 font-bold">Batal</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
