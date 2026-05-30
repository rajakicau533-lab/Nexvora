
"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Landmark, Upload, CheckCircle2, Copy, History, AlertCircle, Image as ImageIcon, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BANK_DETAILS, COIN_PRICE_IDR, CONTACT_INFO } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, doc, setDoc, serverTimestamp, where, orderBy, addDoc } from "firebase/firestore"

export default function TopUpPage() {
  const [amount, setAmount] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const totalPrice = amount * COIN_PRICE_IDR

  // Fetch user top-up history
  const historyQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "topup_requests"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: history } = useCollection<any>(historyQuery)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran adalah 5MB." })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTopUpRequest = async () => {
    if (!db || !user?.uid) return
    
    if (!selectedImage) {
      toast({ variant: "destructive", title: "Bukti Transfer Wajib", description: "Silakan unggah foto bukti transfer terlebih dahulu." })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Simpan ke Firestore
      await addDoc(collection(db, "topup_requests"), {
        userId: user.uid,
        userEmail: user.email,
        amountCoins: amount,
        idrAmount: totalPrice,
        proofUrl: selectedImage, // Storing compressed base64 for MVP
        status: "pending",
        createdAt: serverTimestamp()
      })

      // 2. Format WhatsApp Message
      const message = `Halo Admin Nexvora, saya ingin konfirmasi Top Up Koin.\n\n` +
                      `• Email: ${user.email}\n` +
                      `• Total Koin: ${amount} 🪙\n` +
                      `• Pembayaran: Rp ${totalPrice.toLocaleString()}\n\n` +
                      `Saya melampirkan bukti transfer di chat ini. Mohon segera diproses. Terima kasih.`;
      
      const whatsappUrl = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;

      toast({
        title: "Pengajuan Terkirim! 🎉",
        description: "Mengarahkan ke WhatsApp untuk verifikasi cepat.",
      })
      
      // Redirect to WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Reset form
      setAmount(10)
      setSelectedImage(null)
    } catch (err: any) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Gagal Mengirim",
        description: err.message || "Terjadi kesalahan saat memproses permintaan.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Berhasil Disalin",
      description: "Nomor rekening telah disalin ke clipboard.",
    })
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold text-white">Top Up Koin 🪙</h2>
        <p className="text-muted-foreground">Isi saldo koin Nexvora untuk mengakses layanan premium.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle className="text-white">Pengajuan Top Up</CardTitle>
              <CardDescription>Masukkan jumlah koin yang ingin Anda beli.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1">Jumlah Koin</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-14 text-2xl font-headline font-bold rounded-2xl pl-12 text-white"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl">🪙</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Harga per Koin</span>
                  <span className="font-bold text-white">Rp {COIN_PRICE_IDR.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg border-t border-white/5 pt-4">
                  <span className="font-headline font-bold text-white">Total Pembayaran</span>
                  <span className="font-headline font-bold text-primary">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1">Upload Bukti Transfer</Label>
                
                {selectedImage ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button variant="destructive" size="sm" onClick={() => setSelectedImage(null)} className="rounded-xl">
                         <X className="h-4 w-4 mr-2" /> Hapus Gambar
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center bg-white/[0.02] hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Pilih File Bukti Transfer</p>
                    <p className="text-xs text-muted-foreground">Klik di sini untuk membuka galeri (JPG, PNG)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </div>

              <Button 
                onClick={handleTopUpRequest}
                disabled={isSubmitting || amount < 1}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Konfirmasi Top Up"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Landmark className="text-primary h-5 w-5" /> Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Nama Bank</p>
                    <p className="text-xl font-headline font-bold text-white">{BANK_DETAILS.bank_name}</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary border border-primary/20 text-[10px] font-black uppercase">OFFICIAL</Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Nomor Rekening</p>
                    <div className="flex items-center justify-between gap-2 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-primary/30 transition-colors">
                      <span className="text-xl font-headline font-bold text-primary tracking-widest">{BANK_DETAILS.account_number}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_DETAILS.account_number)} className="hover:bg-primary/20 text-muted-foreground hover:text-primary h-10 w-10">
                        <Copy className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Atas Nama</p>
                    <p className="text-sm font-bold text-white uppercase">{BANK_DETAILS.account_holder}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                {[
                  "Pastikan transfer nominal sesuai hingga digit terakhir.",
                  "Admin akan memverifikasi manual dalam 5-15 menit.",
                  "Setelah klik kirim, silakan kirim bukti di WhatsApp."
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden">
            <CardHeader className="py-5 px-6 border-b border-white/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-primary" /> Riwayat Top Up
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[300px] overflow-auto">
                {!history || history.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs italic">Belum ada riwayat top up.</div>
                ) : (
                  history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <p className="font-bold text-white">{item.amountCoins} Koin</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-medium">
                          {item.createdAt?.toDate().toLocaleDateString() || 'Proses...'}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          item.status === 'approved' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
                          item.status === 'rejected' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 
                          'border-amber-500/30 text-amber-500 bg-amber-500/5'
                        }
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
