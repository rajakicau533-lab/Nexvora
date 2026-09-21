"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { QrCode, History, AlertCircle, Loader2, Clock, CreditCard, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

const COIN_PRICE = 3000;

export default function TopUpPage() {
  const [amount, setAmount] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [qrisData, setQrisData] = useState<{
    qrisUrl: string;
    referenceId: string;
    amount: number;
    expiresAt?: string;
    requestId: string;
  } | null>(null)
  
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

  const { data: history } = useCollection<any>(historyQuery)

  // Listen untuk status transaksi yang sedang aktif (Realtime)
  useEffect(() => {
    if (!db || !qrisData?.requestId) return;

    const unsubscribe = onSnapshot(doc(db, "topup_requests", qrisData.requestId), (snapshot) => {
      if (snapshot.exists() && snapshot.data().status === 'approved') {
        toast({ 
          title: "Top Up Berhasil! 💎", 
          description: `${qrisData.amount / COIN_PRICE} koin telah masuk ke saldo Anda.` 
        });
        setQrisData(null);
      }
    });

    return () => unsubscribe();
  }, [db, qrisData, toast]);

  const handleCreateQris = async () => {
    if (!user?.uid) return;
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
      if (!response.ok) throw new Error(result.error || "Gagal membuat QRIS");

      setQrisData(result.data);
      toast({ title: "QRIS Berhasil Dibuat", description: "Silakan selesaikan pembayaran." });

    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold text-white">Top Up Koin 🪙</h2>
        <p className="text-muted-foreground text-sm">Akses layanan premium Nexvora dengan pengisian koin otomatis via QRIS.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 shadow-2xl overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-white">Beli Saldo Koin</CardTitle>
              <CardDescription>Pilih jumlah koin. Pembayaran akan diverifikasi secara otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
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
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Harga Satuan</span>
                  <span className="font-bold text-white">Rp {COIN_PRICE.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="font-headline font-bold text-white text-lg">Total Pembayaran</span>
                  <span className="font-headline font-black text-primary text-2xl">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button 
                onClick={handleCreateQris}
                disabled={isSubmitting || amount < 1}
                className="w-full h-16 rounded-2xl luxury-gradient border-none font-black text-xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : <><CreditCard className="mr-2 h-6 w-6" /> BAYAR DENGAN QRIS</>}
              </Button>

              <div className="flex items-center justify-center gap-6 pt-4 text-white/30">
                 <div className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /><span className="text-[9px] font-black uppercase">Secure</span></div>
                 <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span className="text-[9px] font-black uppercase">Instant</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden h-fit">
            <CardHeader className="py-6 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <History className="h-4 w-4 text-primary" /> Riwayat Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                {!history || history.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs italic">Belum ada riwayat pengisian.</div>
                ) : (
                  history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white text-sm">{item.amountCoins} Koin</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black">
                          {new Date(item.createdAt?.toDate?.() || 0).toLocaleDateString()} • QRIS
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
        </div>
      </div>

      {/* Modal QRIS Asli */}
      <Dialog open={!!qrisData} onOpenChange={(open) => !open && setQrisData(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-8 max-w-sm shadow-2xl">
          <DialogHeader className="text-center space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <QrCode className="h-8 w-8 text-primary" />
             </div>
             <div className="space-y-1">
                <DialogTitle className="text-2xl font-headline font-bold">Scan & Bayar</DialogTitle>
                <DialogDescription className="text-muted-foreground text-xs uppercase font-black tracking-widest">Otomatis Terverifikasi</DialogDescription>
             </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
             <div className="aspect-square w-full rounded-3xl bg-white p-6 shadow-inner overflow-hidden border-8 border-white/5">
                {qrisData?.qrisUrl && (
                  <img src={qrisData.qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                )}
             </div>

             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Total Bayar</p>
                <p className="text-2xl font-headline font-black text-primary">Rp {qrisData?.amount.toLocaleString()}</p>
             </div>
             
             <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase">
                   <Clock className="h-3.5 w-3.5 text-amber-500" />
                   <span>Masa Berlaku Terbatas</span>
                </div>
                <p className="text-[8px] text-white/20 font-mono">{qrisData?.referenceId}</p>
             </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
             <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
             <p className="text-[9px] text-muted-foreground leading-relaxed italic">
               Saldo akan otomatis bertambah setelah pembayaran sukses. Jangan tutup halaman ini jika ingin melihat notifikasi instan.
             </p>
          </div>
          
          <Button variant="ghost" onClick={() => setQrisData(null)} className="w-full mt-2 text-white/30 hover:text-white transition-colors">Tutup</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
