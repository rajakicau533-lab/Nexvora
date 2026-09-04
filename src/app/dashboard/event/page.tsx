
"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Gift, Zap, Crown, CheckCircle2, MessageCircle, Copy, Clock, AlertCircle, Info, Loader2 } from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase"
import { collection, doc, addDoc, serverTimestamp, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { BANK_DETAILS, CONTACT_INFO } from "@/lib/constants"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

/**
 * @fileOverview Halaman Event Nexvora Studio.
 * Menampilkan program benefit khusus member dengan sistem klaim bulanan dan aktivasi premium.
 */
export default function EventPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // --- UI States ---
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Data Fetching ---
  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // Current period for monthly event (YYYY-MM)
  const currentPeriod = useMemo(() => new Date().toISOString().slice(0, 7), [])

  const claimsQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "event_claims"), where("userId", "==", user.uid))
  }, [db, user?.uid])

  const { data: claims, loading: claimsLoading } = useCollection<any>(claimsQuery)

  // --- Logic Helpers ---
  const monthlyClaim = useMemo(() => {
    return claims?.find(c => c.eventId === 'monthly_topup_600' && c.period === currentPeriod)
  }, [claims, currentPeriod])

  const premiumClaim = useMemo(() => {
    return claims?.find(c => c.eventId === 'premium_activation_170')
  }, [claims])

  const isPremiumUser = profile?.role === 'premium' || profile?.premiumBadge === true

  const handleClaim = async (event: any) => {
    if (!db || !user?.uid) return
    setIsSubmitting(true)

    try {
      // 1. Create a claim record in Firestore
      const claimData = {
        userId: user.uid,
        userEmail: user.email,
        username: profile?.username || user.email?.split('@')[0],
        eventId: event.id,
        eventType: event.type,
        period: event.type === 'monthly' ? currentPeriod : 'permanent',
        amount: event.amount,
        rewardCoins: event.reward,
        status: "pending",
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, "event_claims"), claimData)

      // 2. Generate WhatsApp message
      const message = `Halo Admin Nexvora Studio, saya ingin mengirim bukti transfer untuk ${event.title}.\n\n` +
                      `Nama/Username: ${claimData.username}\n` +
                      `ID User: ${user.uid}\n` +
                      `Nominal Transfer: Rp ${event.amount.toLocaleString()}\n` +
                      `Waktu Transfer: ${new Date().toLocaleString()}\n\n` +
                      `Saya lampirkan bukti transfer.`;
      
      const whatsappUrl = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(message)}`;
      
      toast({ title: "Pengajuan Terkirim", description: "Silakan konfirmasi melalui WhatsApp Admin." })
      window.open(whatsappUrl, '_blank')
      setSelectedEvent(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Klaim", description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyBankNumber = () => {
    navigator.clipboard.writeText(BANK_DETAILS.account_number)
    toast({ title: "Berhasil Disalin", description: "Nomor rekening telah disalin ke clipboard." })
  }

  if (claimsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline mt-4">Mempersiapkan promo khusus...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-20 animate-in fade-in duration-700 px-4 md:px-0">
      {/* 1. Header Banner */}
      <section className="relative aspect-video md:aspect-[21/9] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group bg-black">
        {/* Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-black to-black z-0" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0" />
        
        {/* Decorative Watermark - Positioned to not overlap text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
           <span className="text-[12vw] font-black text-white/[0.03] uppercase tracking-[0.2em] transform -rotate-12 translate-y-12">
              NEXVORA
           </span>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full z-0" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-800/5 blur-[120px] rounded-full z-0" />

        {/* Main Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 py-10 md:p-12 space-y-4 md:space-y-6">
           <Badge className="bg-primary/20 text-primary border border-primary/30 px-6 py-1.5 text-[10px] md:text-xs font-black tracking-[0.3em] uppercase mb-1 md:mb-2">
              EKSKLUSIF MEMBER
           </Badge>
           
           <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-headline font-black text-white tracking-tighter drop-shadow-2xl">
              EVENT <span className="text-primary italic">NEXVORA</span> STUDIO
           </h1>
           
           <div className="max-w-2xl mx-auto">
              <p className="text-white/60 text-sm sm:text-base md:text-xl font-medium tracking-wide leading-relaxed">
                 Dapatkan bonus koin melimpah dan akses fitur premium melalui program promo terbatas kami.
              </p>
           </div>
        </div>
        
        {/* Bottom indicator - visible on desktop */}
        <div className="absolute bottom-6 right-10 hidden md:flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">LIVE CAMPAIGN</span>
        </div>
      </section>

      {/* 2. Event Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
        {/* Card 1: Event Bulanan */}
        <Card className="premium-card rounded-[3rem] bg-black/40 border-white/5 overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.01] hover:border-primary/30 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader className="p-8 md:p-10 pb-0 flex flex-row justify-between items-start">
             <div className="space-y-1">
                <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-2">1X / BULAN</Badge>
                <CardTitle className="text-2xl md:text-3xl font-headline font-bold text-white">EVENT BULANAN</CardTitle>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Gift className="h-7 w-7 text-primary" />
             </div>
          </CardHeader>
          <CardContent className="p-8 md:p-10 flex-1 space-y-10">
             <div className="space-y-6">
                <div className="space-y-1">
                   <p className="text-xs font-black text-white/40 uppercase tracking-widest">Kebutuhan Top Up</p>
                   <p className="text-4xl md:text-5xl font-headline font-black text-white tracking-tight animate-pulse shadow-primary/20">Rp 1.000.000</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center justify-between group">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Benefit Reward</p>
                      <p className="text-3xl font-headline font-black text-primary group-hover:scale-110 transition-transform origin-left duration-500">600 Koin <span className="text-lg">🪙</span></p>
                   </div>
                   <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Zap className="h-6 w-6 fill-primary" />
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <Button 
                  onClick={() => setSelectedEvent({ id: 'monthly_topup_600', type: 'monthly', title: 'Event Bulanan', amount: 1000000, reward: 600 })}
                  disabled={!!monthlyClaim}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black text-lg transition-all",
                    monthlyClaim ? "bg-white/5 text-white/40 border border-white/10" : "luxury-gradient border-none shadow-xl shadow-primary/20 hover:scale-[1.02]"
                  )}
                >
                   {monthlyClaim?.status === 'pending' ? "⏳ VERIFIKASI PENDING" : 
                    monthlyClaim?.status === 'approved' ? "✓ BERHASIL DIKLAIM" : 
                    "KLAIM EVENT SEKARANG"}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                   {monthlyClaim ? (
                     <span className="text-green-500">Event sudah digunakan bulan ini.</span>
                   ) : (
                     <span className="text-white/30">✓ Tersedia untuk periode {currentPeriod}</span>
                   )}
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Card 2: Aktivasi Premium */}
        <Card className="premium-card rounded-[3rem] bg-black/60 border-amber-500/10 overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.01] hover:border-amber-500/30 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <CardHeader className="p-8 md:p-10 pb-0 flex flex-row justify-between items-start">
             <div className="space-y-1">
                <Badge variant="outline" className="border-amber-500/20 text-amber-500 font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-2">HANYA 1X</Badge>
                <CardTitle className="text-2xl md:text-3xl font-headline font-bold text-white">AKTIVASI PREMIUM</CardTitle>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <Crown className="h-7 w-7 text-amber-500" />
             </div>
          </CardHeader>
          <CardContent className="p-8 md:p-10 flex-1 space-y-10">
             <div className="space-y-6">
                <div className="space-y-1">
                   <p className="text-xs font-black text-white/40 uppercase tracking-widest">Biaya Aktivasi</p>
                   <p className="text-4xl md:text-5xl font-headline font-black text-white tracking-tight">Rp 500.000</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Benefit Utama</p>
                        <p className="text-2xl font-headline font-black text-amber-500">170 Koin <span className="text-sm">🪙</span></p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-amber-500" />
                   </div>
                   <div className="h-px bg-amber-500/10 w-full" />
                   <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <p className="text-[10px] text-white font-bold uppercase tracking-tight">Selanjutnya harga Premium: Rp 2.000 / Koin</p>
                   </div>
                </div>
             </div>

             <div className="space-y-4">
                <Button 
                  onClick={() => setSelectedEvent({ id: 'premium_activation_170', type: 'premium_activation', title: 'Aktivasi Premium', amount: 500000, reward: 170 })}
                  disabled={isPremiumUser || premiumClaim?.status === 'pending' || premiumClaim?.status === 'approved'}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black text-lg transition-all",
                    (isPremiumUser || premiumClaim?.status === 'approved') ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                    premiumClaim?.status === 'pending' ? "bg-white/5 text-white/40 border border-white/10" :
                    "bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 border-none shadow-xl shadow-amber-500/20 hover:scale-[1.02] text-black"
                  )}
                >
                   {premiumClaim?.status === 'pending' ? "⏳ VERIFIKASI PENDING" : 
                    (isPremiumUser || premiumClaim?.status === 'approved') ? "✓ PREMIUM MEMBER AKTIF" : 
                    "AKTIFKAN PREMIUM SEKARANG"}
                </Button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                   {isPremiumUser ? (
                     <span className="text-amber-500">Akses fitur premium telah terbuka permanen.</span>
                   ) : (
                     <span className="text-white/30">✓ Kesempatan aktivasi tersedia</span>
                   )}
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Explanation Section */}
      <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10">
         <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
               <Info className="h-8 w-8 text-white/40" />
            </div>
            <div className="space-y-1">
               <h3 className="text-2xl font-headline font-bold text-white">Cara Kerja Event</h3>
               <p className="text-muted-foreground text-sm leading-relaxed">
                 Event Nexvora Studio merupakan program benefit khusus member. Setiap event memiliki ketentuan dan periode yang berbeda. Pastikan membaca detail event sebelum melakukan klaim.
               </p>
            </div>
         </div>

         <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
               <h4 className="text-primary font-black uppercase text-xs tracking-widest flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-primary" /> Event Bulanan
               </h4>
               <p className="text-xs text-muted-foreground leading-loose">
                 Event Bulanan dapat diklaim maksimal 1 kali setiap bulan kalender. Setelah melakukan transfer, kirim bukti pembayaran melalui WhatsApp Admin. Claim akan diproses setelah pembayaran diverifikasi.
               </p>
            </div>
            <div className="space-y-4">
               <h4 className="text-amber-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-amber-500" /> Aktivasi Premium
               </h4>
               <p className="text-xs text-muted-foreground leading-loose">
                 Aktivasi Premium Member hanya dapat dilakukan satu kali. Setelah pembayaran diverifikasi, member akan mendapatkan 170 Koin dan memperoleh harga Premium Rp2.000 per Koin sesuai ketentuan yang berlaku.
               </p>
            </div>
         </div>

         <div className="p-6 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/40 font-medium italic">
               Pastikan nominal transfer sesuai dengan nominal event. Klaim yang tidak sesuai ketentuan dapat ditolak oleh admin sistem.
            </p>
         </div>
      </section>

      {/* --- Modals --- */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white rounded-[2.5rem] p-10 max-w-md shadow-2xl">
          <DialogHeader className="text-center space-y-4">
            <div className={cn(
              "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border-2 shadow-2xl transition-all",
              selectedEvent?.type === 'premium_activation' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-primary/10 border-primary/30 text-primary"
            )}>
              {selectedEvent?.type === 'premium_activation' ? <Crown className="h-10 w-10" /> : <Gift className="h-10 w-10" />}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-tight">{selectedEvent?.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">Konfirmasi pembayaran untuk memproses benefit.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Top Up</p>
                  <p className="text-sm font-bold text-white">Rp {selectedEvent?.amount.toLocaleString()}</p>
               </div>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Benefit</p>
                  <p className="text-sm font-bold text-primary">{selectedEvent?.reward} Koin</p>
               </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-5">
               <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Rekening Tujuan</p>
                  <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">BRI OFFICIAL</Badge>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between group cursor-pointer" onClick={copyBankNumber}>
                     <div>
                        <p className="text-xl font-headline font-black text-primary tracking-widest">{BANK_DETAILS.account_number}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase mt-1">{BANK_DETAILS.account_holder}</p>
                     </div>
                     <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-primary/10 hover:text-primary">
                        <Copy className="h-5 w-5" />
                     </Button>
                  </div>
               </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
               <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
               <p className="text-[10px] text-muted-foreground leading-relaxed font-medium italic">
                 Silakan lakukan transfer sesuai nominal. Setelah itu, kirim bukti melalui tombol di bawah.
               </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-col sm:space-x-0">
             <Button 
              onClick={() => handleClaim(selectedEvent)}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-base shadow-xl shadow-primary/20 group"
             >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><MessageCircle className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" /> KIRIM BUKTI TRANSFER</>}
             </Button>
             <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="text-white/40 hover:text-white font-bold h-10">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
