"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Landmark, Upload, CheckCircle2, Copy, History, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BANK_DETAILS, COIN_PRICE_IDR } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, doc, setDoc, serverTimestamp, where, orderBy } from "firebase/firestore"

export default function TopUpPage() {
  const [amount, setAmount] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleTopUpRequest = async () => {
    if (!db || !user?.uid) return
    
    setIsSubmitting(true)

    try {
      const requestRef = doc(collection(db, "topup_requests"))
      
      await setDoc(requestRef, {
        userId: user.uid,
        userEmail: user.email,
        amountCoins: amount,
        idrAmount: totalPrice,
        proofUrl: "placeholder-pending-upload", // In a real app, this would be a Firebase Storage URL
        status: "pending",
        createdAt: serverTimestamp()
      })

      toast({
        title: "Pengajuan Terkirim",
        description: "Admin akan memverifikasi pembayaran Anda segera.",
      })
      
      setAmount(10)
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
        <h2 className="text-3xl font-headline font-bold">Top Up Koin 🪙</h2>
        <p className="text-muted-foreground">Isi saldo koin Nexvora untuk mengakses layanan premium.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5">
            <CardHeader>
              <CardTitle>Pengajuan Top Up</CardTitle>
              <CardDescription>Masukkan jumlah koin yang ingin Anda beli.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Jumlah Koin</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-14 text-2xl font-headline font-bold rounded-2xl pl-12"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl">🪙</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Harga per Koin</span>
                  <span className="font-bold">Rp {COIN_PRICE_IDR.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg border-t border-white/5 pt-4">
                  <span className="font-headline font-bold">Total Pembayaran</span>
                  <span className="font-headline font-bold text-primary">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Upload Bukti Transfer</Label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-bold">Pilih File Bukti Transfer</p>
                  <p className="text-xs text-muted-foreground">Format: JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <Button 
                onClick={handleTopUpRequest}
                disabled={isSubmitting || amount < 1}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Konfirmasi Top Up"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="text-primary h-5 w-5" /> Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Nama Bank</p>
                    <p className="text-xl font-headline font-bold text-white">{BANK_DETAILS.bank_name}</p>
                  </div>
                  <Badge variant="outline" className="border-primary/20 text-primary">OFFICIAL</Badge>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Nomor Rekening</p>
                    <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-xl border border-white/10 group">
                      <span className="text-lg font-headline font-bold text-primary tracking-widest">{BANK_DETAILS.account_number}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_DETAILS.account_number)} className="hover:bg-primary/20 hover:text-primary transition-colors">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Atas Nama</p>
                    <p className="text-sm font-bold text-white uppercase">{BANK_DETAILS.account_holder}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Pastikan transfer nominal sesuai hingga digit terakhir.",
                  "Admin akan memverifikasi manual dalam 5-15 menit.",
                  "Koin otomatis bertambah setelah status 'Approved'."
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card rounded-3xl border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Riwayat Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[300px] overflow-auto">
                {!history || history.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs italic">Belum ada riwayat top up.</div>
                ) : (
                  history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 px-6">
                      <div>
                        <p className="font-bold">{item.amountCoins} Koin</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{item.createdAt?.toDate().toLocaleDateString() || 'Pending'}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          item.status === 'approved' ? 'border-green-500/30 text-green-500' : 
                          item.status === 'rejected' ? 'border-red-500/30 text-red-500' : 
                          'border-amber-500/30 text-amber-500'
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
