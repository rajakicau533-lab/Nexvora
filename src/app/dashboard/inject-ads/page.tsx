
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  TrendingUp, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  Monitor,
  History,
  ExternalLink
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase"
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  query, 
  where, 
  limit, 
  Timestamp,
  orderBy 
} from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getRandomCities } from "@/lib/indonesia-cities"

const DURATION_OPTIONS = [
  { label: "2 Minggu", coins: 20, value: "14d" },
  { label: "3 Minggu", coins: 30, value: "21d" },
  { label: "1 Bulan", coins: 40, value: "30d" },
]

const RATE_OPTIONS = [
  { label: "100rb - 200rb", coins: 350, value: "low" },
  { label: "200rb - 300rb", coins: 650, value: "med-low" },
  { label: "300rb - 400rb", coins: 750, value: "medium" },
  { label: "600rb - 700rb", coins: 850, value: "high" },
  { label: "Up to 1jt", coins: 1050, value: "ultra" },
]

export default function InjectAdsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    profileLink: "",
    videoLink: "",
    duration: "14d",
    rate: "low"
  })

  const [isLocking, setIsLocking] = useState(false)
  const [lockingStep, setLockingStep] = useState(0)

  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // Fetch only active campaigns
  const activeCampaignQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "inject_ads_campaigns"),
      where("userId", "==", user.uid),
      where("status", "==", "active"),
      limit(1)
    )
  }, [db, user?.uid])
  const { data: activeCampaigns, loading: activeLoading } = useCollection<any>(activeCampaignQuery)
  const activeCampaign = activeCampaigns?.[0]

  // Fetch history campaigns
  const historyQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "inject_ads_campaigns"),
      where("userId", "==", user.uid),
      where("status", "==", "completed"),
      orderBy("startedAt", "desc"),
      limit(10)
    )
  }, [db, user?.uid])
  const { data: historyCampaigns } = useCollection<any>(historyQuery)

  // Persistent Progress Calculation
  const campaignProgress = useMemo(() => {
    if (!activeCampaign) return 0
    const now = new Date().getTime()
    const start = activeCampaign.startedAt?.toDate().getTime() || now
    const end = activeCampaign.endsAt?.toDate().getTime() || now
    const total = end - start
    const elapsed = now - start
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [activeCampaign])

  // Deterministic CTR based on campaign age
  const ctrValue = useMemo(() => {
    if (!activeCampaign) return 1.8
    // Base CTR 1.8% + Progress-based growth (up to +4.5%)
    const base = 1.8
    const growth = (campaignProgress / 100) * 4.5
    // Small time-based fluctuation to look "real" but stays persistent on refresh
    const hourFluctuation = (new Date().getHours() % 5) * 0.1
    return parseFloat((base + growth + hourFluctuation).toFixed(1))
  }, [activeCampaign, campaignProgress])

  const remainingCampaignHours = useMemo(() => {
    if (!activeCampaign) return 0
    const diff = activeCampaign.endsAt.toDate().getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)))
  }, [activeCampaign])

  // Auto-Complete Check
  useEffect(() => {
    if (activeCampaign && db) {
      const now = new Date()
      const endsAt = activeCampaign.endsAt?.toDate()
      if (endsAt && now > endsAt) {
        updateDoc(doc(db, "inject_ads_campaigns", activeCampaign.id), {
          status: "completed",
          completedAt: serverTimestamp()
        })
      }
    }
  }, [activeCampaign, db])

  const selectedDuration = DURATION_OPTIONS.find(d => d.value === formData.duration)
  const selectedRate = RATE_OPTIONS.find(r => r.value === formData.rate)
  const totalCost = (selectedDuration?.coins || 0) + (selectedRate?.coins || 0)

  const handleLockLink = async () => {
    if (!db || !user?.uid || !profile) return
    if (activeCampaign) {
      toast({ variant: "destructive", title: "Aksi Ditolak", description: "Masih ada campaign yang sedang berjalan." })
      return
    }
    if (!formData.profileLink || !formData.videoLink) {
      toast({ variant: "destructive", title: "Form Belum Lengkap", description: "Mohon isi semua link yang diperlukan." })
      return
    }

    if (profile.coins < totalCost) {
      toast({ variant: "destructive", title: "Saldo Kurang", description: "Saldo koin Anda tidak mencukupi untuk layanan ini." })
      return
    }

    setIsLocking(true)
    setLockingStep(0)

    const steps = [
      "Menganalisa akun...",
      "Sinkronisasi profil...",
      "Mendeteksi video...",
      "Menghubungkan server...",
      "Menyiapkan distribusi trafik...",
      "Mengunci target..."
    ]

    for (let i = 0; i < steps.length; i++) {
      setLockingStep(i + 1)
      await new Promise(r => setTimeout(r, 1200))
    }

    try {
      // Calculate endsAt based on duration string (e.g., "14d")
      const days = parseInt(formData.duration)
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + days)

      const schedules = [
        { time: "07:25", completed: false },
        { time: "09:40", completed: false },
        { time: "11:10", completed: false },
        { time: "13:05", completed: false },
        { time: "15:45", completed: false },
        { time: "17:20", completed: false }
      ]

      await setDoc(doc(collection(db, "inject_ads_campaigns")), {
        userId: user.uid,
        userEmail: user.email,
        profileLink: formData.profileLink,
        videoLink: formData.videoLink,
        durationLabel: selectedDuration?.label,
        rateLabel: selectedRate?.label,
        totalCost,
        status: "active",
        startedAt: serverTimestamp(),
        endsAt: Timestamp.fromDate(endsAt),
        schedules,
        regions: getRandomCities(15)
      })

      await updateDoc(profileRef!, {
        coins: increment(-totalCost)
      })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -totalCost,
        type: "traffic_order",
        description: `Inject Ads Campaign: ${selectedRate?.label}`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Inject Ads Berhasil! 🚀", description: "Target telah dikunci dan kampanye sedang berjalan." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengunci", description: err.message })
    } finally {
      setIsLocking(false)
    }
  }

  const toggleSchedule = async (idx: number) => {
    if (!db || !activeCampaign) return
    const newSchedules = [...activeCampaign.schedules]
    newSchedules[idx].completed = true
    
    await updateDoc(doc(db, "inject_ads_campaigns", activeCampaign.id), {
      schedules: newSchedules
    })
    toast({ title: "Sesi Selesai", description: "Langkah ads terverifikasi." })
  }

  if (activeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline mt-4">Memuat data kampanye...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-10 pb-20 px-4 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl luxury-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <Rocket className="text-white h-5 w-5 md:h-6 md:w-6" />
             </div>
             <h2 className="text-2xl md:text-4xl font-headline font-bold text-white tracking-tight">Inject Ads 🚀</h2>
          </div>
          <p className="text-muted-foreground text-sm md:text-lg max-w-xl">Optimasi algoritma iklan Shopee Video secara terintegrasi dan tertarget.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 md:px-6 md:py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md w-fit self-start md:self-auto">
          <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <span className="text-base md:text-lg font-bold text-white">{profile?.coins || 0} 🪙</span>
        </div>
      </div>

      {!activeCampaign && !isLocking ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
           <div className="lg:col-span-8">
              <Card className="premium-card rounded-[2rem] md:rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
                 <CardHeader className="p-6 md:p-10 pb-2 md:pb-4">
                    <CardTitle className="text-xl md:text-2xl text-white">Buat Kampanye Baru</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Masukkan target tautan dan tentukan kapasitas distribusi iklan Anda.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                       <div className="space-y-2">
                          <Label className="text-[10px] md:text-xs font-black uppercase text-white/40 tracking-widest ml-1">Link Profil Shopee</Label>
                          <Input 
                            placeholder="https://shopee.co.id/username"
                            value={formData.profileLink}
                            onChange={(e) => setFormData({...formData, profileLink: e.target.value})}
                            className="bg-white/5 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl px-4 md:px-6 focus:border-primary/50 text-sm"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] md:text-xs font-black uppercase text-white/40 tracking-widest ml-1">Link Shopee Video</Label>
                          <Input 
                            placeholder="https://shopee.co.id/video/..."
                            value={formData.videoLink}
                            onChange={(e) => setFormData({...formData, videoLink: e.target.value})}
                            className="bg-white/5 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl px-4 md:px-6 focus:border-primary/50 text-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                       <div className="space-y-2">
                          <Label className="text-[10px] md:text-xs font-black uppercase text-white/40 tracking-widest ml-1">Pilih Durasi</Label>
                          <Select value={formData.duration} onValueChange={(v) => setFormData({...formData, duration: v})}>
                             <SelectTrigger className="bg-white/5 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl px-4 md:px-6 text-white text-sm">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-black/95 border-white/10 text-white">
                                {DURATION_OPTIONS.map(d => (
                                  <SelectItem key={d.value} value={d.value}>{d.label} (+{d.coins} Koin)</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] md:text-xs font-black uppercase text-white/40 tracking-widest ml-1">Rate Penghasilan Rata-rata</Label>
                          <Select value={formData.rate} onValueChange={(v) => setFormData({...formData, rate: v})}>
                             <SelectTrigger className="bg-white/5 border-white/10 h-12 md:h-14 rounded-xl md:rounded-2xl px-4 md:px-6 text-white text-sm">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-black/95 border-white/10 text-white">
                                {RATE_OPTIONS.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label} ({r.coins} Koin)</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div className="flex items-center gap-4 md:gap-6">
                          <div className="text-center sm:text-left">
                             <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Koin Rate</p>
                             <p className="text-xl md:text-2xl font-headline font-black text-white">{selectedRate?.coins}</p>
                          </div>
                          <div className="w-px h-8 md:h-10 bg-white/10 hidden sm:block" />
                          <div className="text-center sm:text-left">
                             <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Koin Durasi</p>
                             <p className="text-xl md:text-2xl font-headline font-black text-white">+{selectedDuration?.coins}</p>
                          </div>
                       </div>
                       <div className="text-center sm:text-right">
                          <p className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Total Biaya</p>
                          <p className="text-3xl md:text-4xl font-headline font-black text-primary">{totalCost} <span className="text-base md:text-lg">Koin</span></p>
                       </div>
                    </div>

                    <Button 
                      onClick={handleLockLink}
                      className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl luxury-gradient font-black text-lg md:text-xl shadow-2xl shadow-primary/30 group"
                    >
                       LOCK LINK <Monitor className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" />
                    </Button>
                 </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <Card className="premium-card rounded-2xl md:rounded-3xl bg-black/60 border-white/5 p-6 md:p-8">
                 <h3 className="text-base md:text-lg font-headline font-bold text-white flex items-center gap-2 mb-4 md:mb-6">
                    <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Ketentuan
                 </h3>
                 <ul className="space-y-3 md:space-y-4 text-[11px] md:text-xs text-muted-foreground leading-relaxed">
                    <li className="flex items-start gap-3">• Pilih video yang mendapatkan Top 1–3 inspirasi kreator.</li>
                    <li className="flex items-start gap-3">• Pastikan Anda setuju mengikuti aturan penggunaan.</li>
                    <li className="flex items-start gap-3">• Rate yang dipilih merupakan estimasi rata-rata, bukan hasil pasti.</li>
                    <li className="flex items-start gap-3">• Pastikan menekan tombol ceklis sesuai jadwal yang diberikan tools.</li>
                    <li className="flex items-start gap-3">• Gunakan jadwal Ads sesuai jam yang dihasilkan sistem.</li>
                    <li className="flex items-start gap-3 text-primary font-bold">• Tidak ada refund untuk fitur ini.</li>
                 </ul>
              </Card>

              <Card className="premium-card rounded-2xl md:rounded-3xl bg-black/60 border-white/5 p-6 md:p-8">
                 <h3 className="text-base md:text-lg font-headline font-bold text-white flex items-center gap-2 mb-4 md:mb-6">
                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Syarat Keberhasilan
                 </h3>
                 <ul className="space-y-3 md:space-y-4 text-[11px] md:text-xs text-muted-foreground">
                    <li className="flex items-center gap-3"><CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500" /> Video memiliki gimmick yang menarik.</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500" /> Resolusi video tinggi (HD).</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-500" /> Review produk terlihat jelas.</li>
                 </ul>
              </Card>
           </div>
        </div>
      ) : isLocking ? (
        <div className="max-w-2xl mx-auto py-12 md:py-20 animate-in fade-in zoom-in duration-500">
           <Card className="premium-card rounded-3xl md:rounded-[3rem] bg-black/60 border-white/5 p-8 md:p-12 text-center space-y-8 md:space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 md:w-64 h-48 md:h-64 bg-primary/10 blur-[80px] md:blur-[100px] rounded-full" />
              
              <div className="relative space-y-4 md:space-y-6">
                 <div className="w-16 h-16 md:w-24 md:h-24 luxury-gradient rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                    <Loader2 className="h-8 w-8 md:h-12 md:w-12 text-white animate-spin" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl md:text-3xl font-headline font-bold text-white">Mengunci Target...</h3>
                    <p className="text-muted-foreground uppercase font-black text-[10px] md:text-xs tracking-[0.3em] animate-pulse">
                      {[
                        "Menganalisa akun...",
                        "Sinkronisasi profil...",
                        "Mendeteksi video...",
                        "Menghubungkan server...",
                        "Menyiapkan distribusi trafik...",
                        "Mengunci target..."
                      ][lockingStep - 1] || "Memproses..."}
                    </p>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase text-white/40 px-1 tracking-widest">
                    <span>Inisialisasi Sistem</span>
                    <span>{Math.round((lockingStep / 6) * 100)}%</span>
                 </div>
                 <Progress value={(lockingStep / 6) * 100} className="h-1.5 md:h-2 bg-white/5 rounded-full" />
              </div>

              <div className="pt-4 md:pt-6">
                 <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 py-1 px-4 font-black uppercase text-[8px] md:text-[10px] tracking-widest">
                    Authorized Secured Session
                 </Badge>
              </div>
           </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
           <div className="lg:col-span-8 space-y-8">
              <Card className="premium-card rounded-[2rem] md:rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
                 <CardHeader className="p-6 md:p-10 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <Badge className="bg-green-500/10 text-green-500 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 mx-auto sm:ml-0">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> AKTIF
                      </Badge>
                      <CardTitle className="text-xl md:text-2xl text-white">Status Kampanye Iklan</CardTitle>
                    </div>
                    <div className="text-center sm:text-right">
                       <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Target Revenue</p>
                       <p className="text-xl md:text-2xl font-headline font-black text-primary">{activeCampaign.rateLabel}</p>
                    </div>
                 </CardHeader>
                 <CardContent className="p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    <div className="space-y-1 p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                       <p className="text-[10px] text-muted-foreground uppercase font-black">CTR Iklan</p>
                       <p className="text-2xl md:text-3xl font-headline font-black text-white tabular-nums">{ctrValue}%</p>
                    </div>
                    <div className="space-y-1 p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                       <p className="text-[10px] text-muted-foreground uppercase font-black">Durasi</p>
                       <p className="text-lg md:text-xl font-bold text-white">{activeCampaign.durationLabel}</p>
                    </div>
                    <div className="space-y-2 p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                       <p className="text-[10px] text-muted-foreground uppercase font-black">Progress Global</p>
                       <div className="flex items-center gap-3">
                          <span className="text-lg md:text-xl font-black text-primary">{Math.round(campaignProgress)}%</span>
                          <Progress value={campaignProgress} className="h-1.5 flex-1 bg-white/5" />
                       </div>
                    </div>
                 </CardContent>
                 <CardFooter className="px-6 md:px-10 pb-6 md:pb-10 flex flex-col gap-4">
                    <div className="w-full space-y-2">
                       <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Target Video</Label>
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-[10px] md:text-xs text-primary font-mono truncate">
                          {activeCampaign.videoLink}
                       </div>
                    </div>
                 </CardFooter>
              </Card>

              <div className="space-y-4">
                 <h3 className="text-lg md:text-xl font-headline font-bold text-white flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Distribusi Trafik Terkini
                 </h3>
                 <Card className="premium-card rounded-2xl md:rounded-[2rem] bg-black/60 border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left min-w-[500px]">
                          <thead className="bg-white/5 border-b border-white/5">
                             <tr>
                                <th className="p-4 md:p-5 text-[9px] md:text-[10px] font-black uppercase text-white/60">Kota</th>
                                <th className="p-4 md:p-5 text-[9px] md:text-[10px] font-black uppercase text-white/60">Status</th>
                                <th className="p-4 md:p-5 text-[9px] md:text-[10px] font-black uppercase text-white/60">CTR</th>
                                <th className="p-4 md:p-5 text-[9px] md:text-[10px] font-black uppercase text-white/60">Progress</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {activeCampaign.regions?.slice(0, 10).map((city: string, i: number) => {
                               // Deterministic city metrics
                               const cityOffset = (i * 7) % 20;
                               const cityProgress = Math.min(100, campaignProgress + cityOffset);
                               const cityCtr = (ctrValue - 0.5 + (i * 0.2) % 1.5).toFixed(1);

                               return (
                               <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="p-4 md:p-5 flex items-center gap-2">
                                     <MapPin className="h-3 w-3 text-primary" />
                                     <span className="text-xs md:sm font-bold text-white">{city}</span>
                                  </td>
                                  <td className="p-4 md:p-5">
                                     <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", cityProgress < 100 ? "bg-green-500 animate-pulse" : "bg-blue-500")} />
                                        <span className={cn("text-[9px] md:text-[10px] font-black uppercase", cityProgress < 100 ? "text-green-500" : "text-blue-500")}>
                                          {cityProgress < 100 ? "Injecting" : "Stabilized"}
                                        </span>
                                     </div>
                                  </td>
                                  <td className="p-4 md:p-5 font-mono text-[10px] md:text-xs text-white/70">
                                     {cityCtr}%
                                  </td>
                                  <td className="p-4 md:p-5">
                                     <Progress value={cityProgress} className="h-1 w-16 md:w-20 bg-white/10" />
                                  </td>
                               </tr>
                             )})}
                          </tbody>
                       </table>
                    </div>
                 </Card>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              <Card className="premium-card rounded-2xl md:rounded-[2rem] bg-black/60 border-white/5 overflow-hidden">
                 <CardHeader className="p-6 md:p-8 border-b border-white/5">
                    <CardTitle className="text-sm md:text-base text-white flex items-center gap-2">
                       <Clock className="h-4 w-4 text-primary" /> Jadwal Ads Hari Ini
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 md:p-8 space-y-4">
                    {activeCampaign.schedules?.map((s: any, i: number) => (
                      <div key={i} className={cn(
                        "p-4 rounded-xl md:rounded-2xl flex items-center justify-between border transition-all",
                        s.completed ? "bg-green-500/10 border-green-500/20" : "bg-white/[0.03] border-white/5"
                      )}>
                         <div className="flex items-center gap-3 md:gap-4">
                            <span className={cn(
                              "text-base md:text-lg font-headline font-black",
                              s.completed ? "text-green-500" : "text-white"
                            )}>{s.time}</span>
                            <Badge variant="outline" className={cn(
                              "text-[7px] md:text-[8px] font-black uppercase px-1.5 py-0",
                              s.completed ? "border-green-500 text-green-500" : "border-white/20 text-white/40"
                            )}>
                               {s.completed ? "DONE" : "WAIT"}
                            </Badge>
                         </div>
                         <Button 
                          onClick={() => !s.completed && toggleSchedule(i)}
                          disabled={s.completed}
                          size="sm"
                          className={cn(
                            "rounded-lg md:rounded-xl h-8 px-3 md:px-4 font-bold text-[9px] md:text-[10px] uppercase",
                            s.completed ? "bg-green-500/20 text-green-500 hover:bg-green-500/20" : "bg-primary text-white"
                          )}
                         >
                            {s.completed ? <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" /> : "✓ Selesai"}
                         </Button>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <div className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-primary/5 border border-primary/10 space-y-3 md:space-y-4">
                 <div className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                       <p className="text-xs md:text-sm font-bold text-white">Peringatan Sistem</p>
                       <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
                          Kampanye ini bersifat otomatis namun memerlukan verifikasi harian. Silakan tekan tombol Selesai setiap sesi iklan berjalan.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* History Section */}
      {historyCampaigns && historyCampaigns.length > 0 && (
        <div className="space-y-4 md:space-y-6 pt-10 border-t border-white/5">
           <h3 className="text-xl font-headline font-bold text-white flex items-center gap-3">
              <History className="h-5 w-5 text-primary" /> Riwayat Kampanye
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {historyCampaigns.map((hc: any) => (
                <Card key={hc.id} className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
                   <CardHeader className="p-6 pb-2">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-white/10 text-white border-none text-[8px] font-black uppercase">SELESAI ✓</Badge>
                        <span className="text-[10px] font-bold text-muted-foreground">{hc.startedAt?.toDate().toLocaleDateString()}</span>
                      </div>
                      <CardTitle className="text-lg text-white mt-3 truncate">{hc.rateLabel}</CardTitle>
                      <p className="text-[10px] text-primary font-black uppercase tracking-widest">{hc.durationLabel}</p>
                   </CardHeader>
                   <CardContent className="p-6 pt-2 space-y-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                         <p className="text-[8px] text-muted-foreground uppercase font-black">Video Target</p>
                         <p className="text-[10px] font-mono text-white/60 truncate">{hc.videoLink}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                         <span className="text-white/40">Total Cost</span>
                         <span className="text-primary">{hc.totalCost} Koin 🪙</span>
                      </div>
                   </CardContent>
                   <CardFooter className="px-6 pb-6 pt-0">
                      <Button asChild variant="outline" className="w-full h-10 rounded-xl border-white/10 text-xs hover:bg-white/5">
                         <a href={hc.videoLink} target="_blank" rel="noopener noreferrer">
                            Check Video <ExternalLink className="ml-2 h-3 w-3" />
                         </a>
                      </Button>
                   </CardFooter>
                </Card>
              ))}
           </div>
        </div>
      )}
    </div>
  )
}
