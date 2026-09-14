
"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  SearchCode, 
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
  Trophy,
  Trash2,
  Clock
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

const PRICE_PER_LINK = 40000
const PRICE_PER_WINNING = 3000

/**
 * @fileOverview Halaman Layanan Bongkar Akun Shopee Video.
 * Memungkinkan user memesan analisis mendalam untuk profil kompetitor atau akun sendiri.
 */
export default function BongkarAkunPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  // --- Form State ---
  const [profileLinks, setProfileLinks] = useState<string[]>([""])
  const [winningCount, setWinningCount] = useState(1)

  // --- UI State ---
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [proofImage, setProofImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Calculations ---
  const activeLinks = profileLinks.filter(l => l.trim().length > 0)
  const totalPayment = (activeLinks.length * PRICE_PER_LINK) + (winningCount * PRICE_PER_WINNING)

  const handleAddLink = () => setProfileLinks([...profileLinks, ""])
  
  const handleRemoveLink = (idx: number) => {
    const newLinks = profileLinks.filter((_, i) => i !== idx)
    setProfileLinks(newLinks.length > 0 ? newLinks : [""])
  }

  const handleLinkChange = (idx: number, val: string) => {
    const newLinks = [...profileLinks]
    newLinks[idx] = val
    setProfileLinks(newLinks)
  }

  const handleProcessOrder = () => {
    if (activeLinks.length === 0) {
      toast({ 
        variant: "destructive", 
        title: "Link Wajib", 
        description: "Masukkan minimal 1 link profil Shopee Video yang valid." 
      })
      return
    }
    if (winningCount < 1) {
      toast({ 
        variant: "destructive", 
        title: "Winning Produk", 
        description: "Jumlah winning produk minimal 1." 
      })
      return
    }
    setShowSummary(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: "destructive", title: "Format Salah", description: "Hanya file gambar yang diizinkan." })
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

  const handleSendToAdmin = async () => {
    if (!db || !user?.uid || !proofImage) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Pastikan Anda sudah login dan mengunggah bukti transfer." })
      return
    }
    
    setIsProcessing(true)

    try {
      // 1. Simpan data pesanan ke Firestore
      const orderData = {
        userId: user.uid,
        userEmail: user.email || 'No Email',
        profileLinks: activeLinks,
        numLinks: activeLinks.length,
        numWinningProducts: winningCount,
        totalPrice: totalPayment,
        status: "pending",
        proofUrl: proofImage,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, "bongkar_akun_orders"), orderData)

      // 2. Siapkan pesan WhatsApp otomatis
      const message = `Halo Admin Nexvora Studio,\n\nSaya ingin memesan Jasa Bongkar Akun.\n\n` +
        `• Akun User: ${user.email}\n` +
        `• Jumlah Link: ${activeLinks.length}\n` +
        `• Winning Produk: ${winningCount} Item\n` +
        `• Harga per Link: Rp ${PRICE_PER_LINK.toLocaleString()}\n` +
        `• Harga per Winning: Rp ${PRICE_PER_WINNING.toLocaleString()}\n` +
        `• TOTAL BAYAR: Rp ${totalPayment.toLocaleString()}\n\n` +
        `• Tautan Profil:\n${activeLinks.join('\n')}\n\n` +
        `• Status: Menunggu Verifikasi Pembayaran\n\n` +
        `Saya sudah melampirkan bukti transfer. Mohon segera diproses. Terima kasih!`;

      const whatsappUrl = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
      
      toast({ title: "Pesanan Dikirim! 🎉", description: "Mengarahkan ke WhatsApp Admin..." })
      
      // Tunggu sedikit agar toast terbaca sebelum redirect
      setTimeout(() => {
        window.open(whatsappUrl, '_blank')
        setShowSummary(false)
        setProofImage(null)
        setProfileLinks([""])
        setWinningCount(1)
        setIsProcessing(false)
      }, 1000)

    } catch (err: any) {
      console.error("Error saving order:", err)
      toast({ variant: "destructive", title: "Gagal Simpan", description: err.message })
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl luxury-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <SearchCode className="text-white h-6 w-6" />
             </div>
             <h2 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">Bongkar Akun 🔍</h2>
          </div>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl">
            Dapatkan data winning produk dari profil Shopee Video target untuk strategi konten yang lebih efektif.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden shadow-2xl">
             <CardHeader className="p-8 md:p-10 pb-4">
                <CardTitle className="text-2xl text-white">Konfigurasi Pesanan</CardTitle>
                <CardDescription>Masukkan minimal satu link profil dan tentukan jumlah winning produk.</CardDescription>
             </CardHeader>
             <CardContent className="p-8 md:p-10 space-y-8">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Tautan Profil Shopee Video</Label>
                   <div className="space-y-3">
                      {profileLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 animate-in slide-in-from-left duration-300">
                           <Input 
                              placeholder="https://shopee.co.id/username"
                              value={link}
                              onChange={(e) => handleLinkChange(idx, e.target.value)}
                              className="bg-white/5 border-white/10 h-12 rounded-xl text-white focus:border-primary/50 text-sm flex-1"
                           />
                           {profileLinks.length > 1 && (
                             <Button variant="ghost" size="icon" onClick={() => handleRemoveLink(idx)} className="h-12 w-12 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors">
                                <Trash2 className="h-5 w-5" />
                             </Button>
                           )}
                        </div>
                      ))}
                      <Button variant="outline" onClick={handleAddLink} className="w-full h-12 rounded-xl border-dashed border-white/20 bg-white/5 text-xs font-bold uppercase hover:bg-white/10 hover:border-primary/30 transition-all">
                         <Plus className="h-4 w-4 mr-2" /> Tambah Profil Lain
                      </Button>
                   </div>
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Jumlah Winning Produk (Min. 1)</Label>
                   <div className="flex items-center gap-4 bg-white/5 border border-white/10 h-14 rounded-2xl px-6 max-w-[200px]">
                      <Button variant="ghost" size="icon" onClick={() => setWinningCount(Math.max(1, winningCount - 1))} className="h-8 w-8 text-primary hover:bg-primary/10">
                         <Minus className="h-4 w-4" />
                      </Button>
                      <span className="flex-1 text-center text-xl font-headline font-black text-white">{winningCount}</span>
                      <Button variant="ghost" size="icon" onClick={() => setWinningCount(winningCount + 1)} className="h-8 w-8 text-primary hover:bg-primary/10">
                         <Plus className="h-4 w-4" />
                      </Button>
                   </div>
                </div>

                <div className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className="text-center sm:text-left">
                         <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Per Tautan</p>
                         <p className="text-xl font-headline font-black text-white">Rp {PRICE_PER_LINK.toLocaleString()}</p>
                      </div>
                      <div className="w-px h-10 bg-white/10 hidden sm:block" />
                      <div className="text-center sm:text-left">
                         <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Per Winning</p>
                         <p className="text-xl font-headline font-black text-white">Rp {PRICE_PER_WINNING.toLocaleString()}</p>
                      </div>
                   </div>
                   <div className="text-center sm:text-right">
                      <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Pembayaran</p>
                      <p className="text-3xl font-headline font-black text-primary">Rp {totalPayment.toLocaleString()}</p>
                   </div>
                </div>
             </CardContent>
             <CardFooter className="p-8 md:p-10 pt-0">
                <Button 
                   onClick={handleProcessOrder}
                   className="w-full h-16 rounded-2xl luxury-gradient border-none font-black text-xl shadow-2xl shadow-primary/30 group transition-all hover:scale-[1.01]"
                >
                   PROSES SEKARANG <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Button>
             </CardFooter>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="premium-card rounded-3xl bg-black/60 border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Info className="h-4 w-4" /> INFORMASI LAYANAN
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                       Tim kami akan membongkar performa video dari profil yang Anda berikan untuk menemukan produk mana yang memiliki konversi tertinggi.
                    </p>
                    <div className="space-y-3">
                       {[
                         "Analisis views & likes terdalam",
                         "List winning produk per akun",
                         "Estimasi rasio konversi",
                         "Laporan detail (Excel/PDF)"
                       ].map((f, i) => (
                         <div key={i} className="flex items-center gap-2 group">
                            <CheckCircle2 className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-white/70">{f}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                    <p className="text-[10px] text-muted-foreground font-medium flex items-start gap-2">
                       <Clock className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                       Waktu Pengerjaan: 24 - 48 Jam.
                    </p>
                 </div>
              </CardContent>
           </Card>
           
           <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-3">
              <Trophy className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] text-white/60 font-medium italic">
                 Dapatkan data valid untuk mendominasi pasar affiliate Anda.
              </p>
           </div>
        </div>
      </div>

      {/* --- Summary & Payment Dialog --- */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[2.5rem] p-8 md:p-10 max-w-lg shadow-2xl">
           <div className="space-y-8">
              <div className="text-center space-y-3">
                 <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                    <SearchCode className="text-primary h-8 w-8" />
                 </div>
                 <DialogTitle className="text-2xl font-headline font-bold text-white">Detail Pembayaran</DialogTitle>
                 <DialogDescription className="text-muted-foreground text-sm">
                   Mohon selesaikan transfer untuk memulai proses audit profil.
                 </DialogDescription>
              </div>

              {/* Order Summary Box */}
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase">Total Profil</span>
                    <span className="text-white font-bold">{activeLinks.length} Tautan</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase">Winning Produk</span>
                    <span className="text-white font-bold">{winningCount} Item</span>
                 </div>
                 <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-black uppercase">Total Bayar</span>
                    <span className="text-primary font-black text-xl">Rp {totalPayment.toLocaleString()}</span>
                 </div>
              </div>

              {/* Bank Account Info */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-5">
                 <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Tujuan Transfer</span>
                 </div>
                 <div className="space-y-2 pl-8 border-l border-primary/30">
                    <p className="text-lg font-headline font-bold text-white tracking-tight">{BANK_DETAILS.bank_name}</p>
                    <div className="space-y-0.5">
                       <p className="text-xl font-headline font-black text-primary tracking-widest">{BANK_DETAILS.account_number}</p>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase">{BANK_DETAILS.account_holder}</p>
                    </div>
                 </div>
              </div>

              {/* Upload Proof Area */}
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Bukti Transfer (Gambar)</Label>
                 
                 {proofImage ? (
                   <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group">
                      <img src={proofImage} alt="Bukti Transfer" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Button variant="destructive" size="sm" onClick={() => setProofImage(null)} className="rounded-xl font-bold">
                           <X className="h-4 w-4 mr-2" /> Ganti Gambar
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
                     <p className="text-sm font-bold text-white mb-1">Pilih Bukti Pembayaran</p>
                     <p className="text-[10px] text-muted-foreground uppercase font-black">PNG, JPG • MAKS 5MB</p>
                   </div>
                 )}
                 <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/webp" 
                  onChange={handleImageChange} 
                 />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                 <Button 
                    onClick={handleSendToAdmin}
                    disabled={isProcessing || !proofImage}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group"
                 >
                    {isProcessing ? (
                      <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                      <><MessageCircle className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" /> KONFIRMASI KE ADMIN</>
                    )}
                 </Button>
                 <Button variant="ghost" onClick={() => setShowSummary(false)} className="text-white/40 hover:text-white hover:bg-white/5 font-bold transition-colors">Batal</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
