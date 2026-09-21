
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { QrCode, CheckCircle2, History, AlertCircle, Loader2, Clock, Landmark, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { COIN_PRICE_IDR } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, doc, where, orderBy, onSnapshot } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/**
 * @fileOverview Halaman Top Up Koin.
 * Mendukung pembayaran otomatis via QRIS Kasera Pay.
 */

export default function TopUpPage() {
  const [amount, setAmount] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [qrisData, setQrisData] = useState<{
    qrisUrl: string;
    referenceId: string;
    amount: number;
    expiredAt: string;
    requestId: string;
  } | null>(null)
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const totalPrice = amount * COIN_PRICE_IDR

  // Fetch riwayat top-up user
  const historyQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "topup_requests"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: history } = useCollection<any>(historyQuery)

  // Listen untuk status transaksi yang sedang aktif (Realtime)
  useEffect(() => {
    if (!db || !qrisData?.requestId) return;

    const unsubscribe = onSnapshot(doc(db, "topup_requests", qrisData.requestId), (snapshot) => {
      if (snapshot.exists() && snapshot.data().status === 'approved') {
        toast({ 
          title: "Pembayaran Berhasil! 🎉", 
          description: `Selamat! ${qrisData.amount / COIN_PRICE_IDR} koin telah ditambahkan ke saldo Anda.` 
        });
        setQrisData(null);
      }
    });

    return () => unsubscribe();
  }, [db, qrisData?.requestId, toast, qrisData?.amount]);

  const handleCreateQris = async () => {
    if (!user?.uid) {
      toast({ variant: "destructive", title: "Sesi Habis", description: "Silakan login kembali." });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/kasera/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCoins: amount,
          totalPrice: totalPrice,
          userId: user.uid,
          userEmail: user.email
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal membuat kode QRIS.");
      }

      setQrisData(result.data);
      toast({
        title: "QRIS Dibuat! 🤳",
        description: "Silakan scan kode QR untuk membayar.",
      });

    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Terjadi kesalahan saat memproses pembayaran.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold text-white">Top Up Koin 🪙</h2>
        <p className="text-muted-foreground text-sm">Isi saldo koin Nexvora secara instan untuk mengakses layanan premium.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Top Up */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Beli Koin</CardTitle>
              <CardDescription>Pilih jumlah koin yang Anda butuhkan. Pembayaran diproses otomatis via QRIS.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1">Jumlah Koin</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-14 text-2xl font-headline font-bold rounded-2xl pl-12 text-white focus:border-primary/50"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl">🪙</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Harga per Koin</span>
                  <span className="font-bold text-white">Rp {COIN_PRICE_IDR.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg border-t border-white/5 pt-4">
                  <span className="font-headline font-bold text-white">Total Bayar</span>
                  <span className="font-headline font-bold text-primary">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 flex items-start gap-4">
                <QrCode className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-sm font-bold text-white">Pembayaran QRIS Otomatis</p>
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     Scan kode QR menggunakan Dana, OVO, GoPay, ShopeePay, atau Mobile Banking apa pun. Koin masuk otomatis setelah pembayaran sukses.
                   </p>
                </div>
              </div>

              <Button 
                onClick={handleCreateQris}
                disabled={isSubmitting || amount < 1}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <><CreditCard className="mr-2 h-5 w-5" /> Bayar Sekarang</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Riwayat Samping */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden shadow-xl">
            <CardHeader className="py-5 px-6 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-primary" /> Riwayat Top Up Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[500px] overflow-auto">
                {!history || history.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs italic">Belum ada riwayat pengisian koin.</div>
                ) : (
                  history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white">{item.amountCoins} Koin</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black">
                          {item.method === 'qris' ? 'QRIS' : 'MANUAL'} • {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "border-none text-[8px] font-black uppercase px-2 py-1",
                          item.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                          item.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                          'bg-amber-500/10 text-amber-500'
                        )}
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

      {/* Modal Tampilan QRIS */}
      <Dialog open={!!qrisData} onOpenChange={(open) => !open && setQrisData(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-8 max-w-sm shadow-2xl">
          <DialogHeader className="text-center space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <QrCode className="h-8 w-8 text-primary" />
             </div>
             <div className="space-y-1">
                <DialogTitle className="text-2xl font-headline font-bold">Scan QRIS</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs">Gunakan aplikasi pembayaran Anda.</DialogDescription>
             </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
             <div className="aspect-square w-full rounded-2xl bg-white p-4 shadow-inner overflow-hidden">
                {qrisData?.qrisUrl && (
                  <img src={qrisData.qrisUrl} alt="QRIS Code" className="w-full h-full object-contain" />
                )}
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                   <div className="flex-1">
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">Nominal Pembayaran</p>
                      <p className="text-2xl font-headline font-black text-primary">Rp {qrisData?.amount.toLocaleString()}</p>
                   </div>
                </div>
                
                <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">
                   <Clock className="h-3.5 w-3.5 text-amber-500" />
                   <span>Berlaku 30 menit</span>
                </div>
             </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
             <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
             <p className="text-[9px] text-muted-foreground leading-relaxed font-medium italic">
               Jangan tutup halaman ini. Koin akan masuk secara otomatis setelah pembayaran Anda diverifikasi oleh sistem.
             </p>
          </div>
          
          <Button variant="ghost" onClick={() => setQrisData(null)} className="w-full mt-2 text-white/30 hover:text-white transition-colors">Batal</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
