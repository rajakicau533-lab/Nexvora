"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Crown, 
  Search, 
  FileText, 
  AlertCircle,
  Loader2,
  Info,
  ChevronRight,
  TrendingUp,
  Heart
} from "lucide-react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, setDoc, updateDoc, increment, serverTimestamp, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { getRandomCities } from "@/lib/indonesia-cities"

export default function TrafficProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // --- States ---
  const [isActivating, setIsActivating] = useState<string | null>(null)
  const [activationStep, setActivationStep] = useState(0)
  const [profileLink, setProfileLink] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [checkStep, setCheckStep] = useState(0)
  const [profileData, setProfileData] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [isStartingCampaign, setIsStartingCampaign] = useState(false)
  const [campaignStep, setCampaignStep] = useState(0)
  const [generatedRegions, setGeneratedRegions] = useState<string[]>([])
  const [showHowTo, setShowHowTo] = useState(false)

  // --- Data Fetching ---
  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const campaignQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "profile_traffic_campaigns"),
      where("userId", "==", user.uid),
      where("status", "==", "active"),
      limit(1)
    )
  }, [db, user?.uid])
  const { data: activeCampaigns, loading: campaignLoading } = useCollection<any>(campaignQuery)
  const activeCampaign = activeCampaigns?.[0]

  // --- Derived Stats ---
  const subscription = profile?.profileTrafficSub
  const isSubActive = subscription && subscription.expiresAt?.toDate() > new Date()
  const subTier = isSubActive ? subscription.tier : null
  
  const remainingSubDays = useMemo(() => {
    if (!isSubActive) return 0
    const diff = subscription.expiresAt.toDate().getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [isSubActive, subscription])

  const campaignProgress = useMemo(() => {
    if (!activeCampaign) return 0
    const now = new Date().getTime()
    const start = activeCampaign.startedAt?.toDate().getTime() || now
    const end = activeCampaign.endsAt?.toDate().getTime() || now
    const total = end - start
    const elapsed = now - start
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }, [activeCampaign])

  const remainingCampaignHours = useMemo(() => {
    if (!activeCampaign) return 0
    const diff = activeCampaign.endsAt.toDate().getTime() - new Date().getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)))
  }, [activeCampaign])

  // --- Actions ---
  const handleActivate = async (tier: 'premium' | 'pro') => {
    if (!db || !profile || !user?.uid) return
    const cost = tier === 'premium' ? 5 : 15
    
    if (profile.coins < cost) {
      toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${cost} koin untuk aktivasi.` })
      return
    }

    setIsActivating(tier)
    setActivationStep(0)

    // Visual loading steps
    const steps = [
      "Memverifikasi saldo...",
      "Menyiapkan modul premium...",
      "Mengaktifkan layanan..."
    ]

    for (let i = 0; i < steps.length; i++) {
      setActivationStep(i + 1)
      await new Promise(r => setTimeout(resolve => r(resolve), 1200))
    }

    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      await updateDoc(profileRef!, {
        coins: increment(-cost),
        profileTrafficSub: {
          tier,
          expiresAt: Timestamp.fromDate(expiresAt)
        }
      })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -cost,
        type: "purchase",
        description: `Aktivasi Trafik Profil ${tier.toUpperCase()}`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Layanan Aktif! ✨", description: `Trafik Profil ${tier.toUpperCase()} aktif selama 30 hari.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Aktivasi", description: err.message })
    } finally {
      setIsActivating(null)
      setActivationStep(0)
    }
  }

  const handleCheckProfile = async () => {
    if (!profileLink) return
    setIsChecking(true)
    setCheckStep(0)

    const steps = [
      "Memvalidasi link...",
      "Menganalisis profil...",
      "Menyusun laporan...",
      "Menampilkan hasil..."
    ]

    for (let i = 0; i < steps.length; i++) {
      setCheckStep(i + 1)
      await new Promise(r => setTimeout(resolve => r(resolve), 1000))
    }

    const cleanUsernames = [
      "official_nexvora",
      "creator_store",
      "viral_market",
      "smart_seller",
      "digital_creator",
      "nexvora_creator"
    ]
    const randomUsername = cleanUsernames[Math.floor(Math.random() * cleanUsernames.length)]

    // Mocked profile data - Purely simulated for premium feel
    setProfileData({
      username: randomUsername,
      name: "Kreator Nexvora",
      followers: 218,
      description: "Shopee Video Creator | Digital Marketer | Growth Specialist",
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomUsername}`
    })
    setIsChecking(false)
  }

  const handleStartCampaign = async () => {
    if (!db || !user?.uid || !profileData || !selectedPackage || !profile) return
    
    if (profile.coins < selectedPackage.cost) {
      toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${selectedPackage.cost} koin untuk paket ini.` })
      return
    }

    if (activeCampaign) {
      toast({ variant: "destructive", title: "Aksi Ditolak", description: "Kampanye masih berjalan. Tunggu hingga selesai." })
      return
    }

    setIsStartingCampaign(true)
    setCampaignStep(0)
    setGeneratedRegions([])

    const steps = [
      "Membuat kampanye...",
      "Menyiapkan distribusi...",
      "Menyusun wilayah...",
      "Mengaktifkan monitoring..."
    ]

    for (let i = 0; i < steps.length; i++) {
      setCampaignStep(i + 1)
      await new Promise(r => setTimeout(resolve => r(resolve), 1200))
    }

    // Generate regions one by one
    const regions = getRandomCities(selectedPackage.regions)
    for (const city of regions) {
      setGeneratedRegions(prev => [...prev, city])
      await new Promise(r => setTimeout(resolve => r(resolve), 500))
    }

    try {
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + 7)

      await setDoc(doc(collection(db, "profile_traffic_campaigns")), {
        userId: user.uid,
        profileLink,
        tier: subTier,
        package: selectedPackage.label,
        regions,
        status: "active",
        startedAt: serverTimestamp(),
        endsAt: Timestamp.fromDate(endsAt)
      })

      await updateDoc(profileRef!, {
        coins: increment(-selectedPackage.cost)
      })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -selectedPackage.cost,
        type: "traffic_order",
        description: `Kampanye Trafik Profil: ${selectedPackage.label}`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Kampanye Dimulai! 🚀", description: "Distribusi wilayah telah diaktifkan." })
      setProfileData(null)
      setProfileLink("")
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsStartingCampaign(false)
      setCampaignStep(0)
    }
  }

  // --- UI Constants ---
  const premiumPackages = [
    { label: "Paket Lite", cost: 2, regions: 5 },
    { label: "Paket Standard", cost: 4, regions: 10 },
    { label: "Paket Turbo", cost: 6, regions: 15 }
  ]

  const proPackages = [
    { label: "Paket Elite", cost: 3, regions: 10 },
    { label: "Paket Master", cost: 6, regions: 20 },
    { label: "Paket Legend", cost: 9, regions: 35 }
  ]

  const packages = subTier === 'pro' ? proPackages : premiumPackages

  if (profileLoading || campaignLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse">Menghubungkan Modul Premium...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl luxury-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <Rocket className="text-white h-6 w-6" />
             </div>
             <h2 className="text-4xl font-headline font-bold text-white">Trafik Profil 🚀</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Sistem distribusi trafik profil Shopee Video untuk meningkatkan eksposur akun secara tertarget di seluruh Indonesia.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowHowTo(true)} variant="outline" className="rounded-xl border-white/10 bg-white/5 h-12 font-bold px-6">
             <Info className="mr-2 h-4 w-4" /> CARA PAKAI
          </Button>
          <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-white">{profile?.coins || 0} 🪙</span>
          </div>
        </div>
      </div>

      {!isSubActive ? (
        /* Activation Cards */
        <div className="grid md:grid-cols-2 gap-8">
          {/* Premium Card */}
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <CardHeader className="pt-10 text-center relative z-10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                   <Lock className="text-muted-foreground h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                   🔒 Trafik Profil Premium
                </CardTitle>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Masa Aktif</p>
                  <p className="text-sm font-bold text-red-500">Belum Aktif</p>
                </div>
             </CardHeader>
             <CardContent className="space-y-6 px-10 relative z-10">
                <div className="space-y-4">
                   {[
                     "Distribusi hingga 15 wilayah",
                     "Laporan harian",
                     "Monitoring kampanye 7 hari",
                     "Prioritas Antrian Dasar"
                   ].map((f, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm text-white/80">{f}</span>
                     </div>
                   ))}
                </div>
                <div className="pt-4">
                   <Button 
                    onClick={() => handleActivate('premium')}
                    disabled={!!isActivating}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 font-black text-lg transition-all"
                   >
                     {isActivating === 'premium' ? "PROSES..." : "✨ AKTIFKAN PREMIUM"}
                   </Button>
                   <p className="text-center text-[10px] text-muted-foreground uppercase font-black mt-3 tracking-widest">Biaya: 5 Koin</p>
                </div>
             </CardContent>
          </Card>

          {/* Pro Card */}
          <Card className="premium-card rounded-[2.5rem] border-primary/20 bg-black/60 overflow-hidden relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-30" />
             <div className="absolute top-4 right-4 z-20">
                <Badge className="luxury-gradient border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">Highly Recommended</Badge>
             </div>
             <CardHeader className="pt-10 text-center relative z-10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-2xl shadow-primary/20">
                   <Crown className="text-primary h-7 w-7" />
                </div>
                <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                   🔒 Trafik Profil PRO
                </CardTitle>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Masa Aktif</p>
                  <p className="text-sm font-bold text-primary">Akses Penuh</p>
                </div>
             </CardHeader>
             <CardContent className="space-y-6 px-10 relative z-10">
                <div className="space-y-4">
                   {[
                     "Distribusi hingga 35 wilayah",
                     "Statistik lebih detail & mendalam",
                     "Monitoring kampanye prioritas",
                     "Algoritma penyebaran tercepat"
                   ].map((f, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm text-white/80">{f}</span>
                     </div>
                   ))}
                </div>
                <div className="pt-4">
                   <Button 
                    onClick={() => handleActivate('pro')}
                    disabled={!!isActivating}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                   >
                     {isActivating === 'pro' ? "PROSES..." : "🔥 AKTIFKAN PRO"}
                   </Button>
                   <p className="text-center text-[10px] text-muted-foreground uppercase font-black mt-3 tracking-widest">Biaya: 15 Koin</p>
                </div>
             </CardContent>
          </Card>
        </div>
      ) : activeCampaign ? (
        /* Campaign Dashboard */
        <div className="grid lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              {/* Campaign Status */}
              <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
                 <CardHeader className="py-8 px-10 border-b border-white/5 flex flex-row items-center justify-between">
                    <div>
                      <Badge className="bg-green-500/10 text-green-500 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest mb-2">🟢 Kampanye Aktif</Badge>
                      <CardTitle className="text-2xl text-white">Monitoring Distribusi</CardTitle>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Durasi Tersisa</p>
                       <p className="text-2xl font-headline font-bold text-white">{remainingCampaignHours} Jam</p>
                    </div>
                 </CardHeader>
                 <CardContent className="p-10 space-y-8">
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-sm font-bold text-white/60">Progress Kampanye</span>
                          <span className="text-xl font-headline font-black text-primary">{Math.round(campaignProgress)}%</span>
                       </div>
                       <Progress value={campaignProgress} className="h-4 bg-white/5 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                          <MapPin className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-[9px] text-muted-foreground uppercase font-black">Wilayah</p>
                          <p className="text-lg font-bold text-white">{activeCampaign.regions?.length}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                          <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-[9px] text-muted-foreground uppercase font-black">Durasi</p>
                          <p className="text-lg font-bold text-white">7 Hari</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                          <Users className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-[9px] text-muted-foreground uppercase font-black">Paket</p>
                          <p className="text-xs font-bold text-white truncate">{activeCampaign.package}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                          <ShieldCheck className="h-4 w-4 text-primary mx-auto mb-1" />
                          <p className="text-[9px] text-muted-foreground uppercase font-black">Status</p>
                          <p className="text-[10px] font-bold text-green-500">STABLE ✓</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              {/* Laporan Harian */}
              <div className="space-y-4">
                 <h3 className="text-xl font-headline font-bold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Laporan Distribusi Harian
                 </h3>
                 <div className="grid gap-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                      const isDone = campaignProgress >= (day / 7) * 100;
                      const isCurrent = !isDone && campaignProgress >= ((day - 1) / 7) * 100;
                      
                      return (
                        <Card key={day} className={cn(
                          "premium-card rounded-2xl border-white/5 p-6 flex items-center justify-between transition-all",
                          isDone ? "bg-black/20" : isCurrent ? "bg-primary/5 border-primary/20" : "bg-black/60 opacity-40"
                        )}>
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                                isDone ? "bg-green-500/20 text-green-500" : isCurrent ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                              )}>
                                {day}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white">Hari Ke-{day}</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-black">
                                   {isDone ? "Distribusi Selesai" : isCurrent ? "Distribusi Berjalan..." : "Menunggu Jadwal"}
                                 </p>
                              </div>
                           </div>
                           {isDone ? (
                             <div className="flex gap-2">
                               {activeCampaign.regions?.slice((day-1)*3, day*3).map((r: string, idx: number) => (
                                 <Badge key={idx} variant="outline" className="text-[9px] border-white/10 text-white/60">{r}</Badge>
                               ))}
                             </div>
                           ) : isCurrent ? (
                             <Loader2 className="h-4 w-4 text-primary animate-spin" />
                           ) : (
                             <Clock className="h-4 w-4 text-white/10" />
                           )}
                        </Card>
                      )
                    })}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-8">
              {/* Account Info */}
              <Card className="premium-card rounded-[2rem] bg-black/60 border-white/5 overflow-hidden">
                 <CardHeader className="pb-4">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                       <Crown className="h-4 w-4 text-primary" /> Informasi Langganan
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">Tier Aktif</span>
                       <Badge className="luxury-gradient border-none uppercase text-[9px] font-black">{subTier}</Badge>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                       <span className="text-xs text-muted-foreground">Masa Berlaku</span>
                       <span className="text-xs font-bold text-white">{remainingSubDays} Hari Lagi</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                       <p className="text-[9px] text-muted-foreground uppercase font-black mb-2">Target Link Profil</p>
                       <p className="text-[10px] font-mono text-primary truncate">{activeCampaign.profileLink}</p>
                    </div>
                 </CardContent>
              </Card>

              {/* Notification */}
              <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 space-y-3">
                 <div className="flex items-center gap-3 text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Aturan Kampanye</span>
                 </div>
                 <p className="text-xs text-muted-foreground leading-relaxed">
                    Satu kampanye membutuhkan waktu 7 hari untuk selesai. Selama kampanye berjalan, Anda tidak dapat membuat kampanye baru untuk link yang sama atau berbeda.
                 </p>
              </div>
           </div>
        </div>
      ) : (
        /* Campaign Setup */
        <div className="space-y-8">
           <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-xl text-white">Analisis Profil Shopee Video</CardTitle>
                 <CardDescription>Masukkan link profil Anda untuk memulai optimasi distribusi trafik.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        placeholder="https://shopee.co.id/username_anda"
                        value={profileLink}
                        onChange={(e) => setProfileLink(e.target.value)}
                        className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 text-white focus:border-primary/50"
                       />
                    </div>
                    <Button 
                      onClick={handleCheckProfile}
                      disabled={isChecking || !profileLink}
                      className="h-14 px-10 rounded-2xl luxury-gradient font-black text-base shadow-lg shadow-primary/20"
                    >
                      {isChecking ? (
                        <div className="flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           <span className="uppercase text-xs tracking-tighter">
                             {[
                               "Memvalidasi link...",
                               "Menganalisis profil...",
                               "Menyusun laporan...",
                               "Menampilkan hasil..."
                             ][checkStep - 1] || "Mengecek..."}
                           </span>
                        </div>
                      ) : "🔍 CEK PROFIL"}
                    </Button>
                 </div>

                 {profileData && (
                   <div className="pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      <Card className="bg-white/[0.03] border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 group relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4">
                             <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-black uppercase tracking-widest">
                               <ShieldCheck className="h-3 w-3 mr-1" /> Verified Creator
                             </Badge>
                         </div>
                         <div className="relative">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/20 p-1 bg-black/40">
                               <img src={profileData.photo} className="w-full h-full object-cover rounded-2xl" alt="Profile" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-black">
                               <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                         </div>
                         <div className="flex-1 text-center md:text-left space-y-1">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                               <h4 className="text-2xl font-headline font-bold text-white">{profileData.name}</h4>
                            </div>
                            <p className="text-primary font-black text-xs uppercase tracking-widest">@{profileData.username}</p>
                            <p className="text-sm text-muted-foreground max-w-lg mt-2 italic">{profileData.description}</p>
                            <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
                               <div className="text-center md:text-left">
                                  <p className="text-xl font-headline font-black text-white">{profileData.followers}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Followers</p>
                               </div>
                               <div className="w-px h-8 bg-white/10" />
                               <div className="text-center md:text-left">
                                  <p className="text-sm font-black text-green-500 flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    ACTIVE
                                  </p>
                                  <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Status</p>
                               </div>
                            </div>
                         </div>
                      </Card>

                      <div className="pt-10 space-y-6">
                         <h3 className="text-xl font-headline font-bold text-white text-center flex items-center justify-center gap-2">
                           <TrendingUp className="h-5 w-5 text-primary" /> Pilih Paket Distribusi Wilayah
                         </h3>
                         <div className="grid md:grid-cols-3 gap-6">
                            {packages.map((pkg, i) => (
                              <Card 
                                key={i} 
                                onClick={() => setSelectedPackage(pkg)}
                                className={cn(
                                  "premium-card rounded-3xl p-6 cursor-pointer transition-all hover:scale-105",
                                  selectedPackage?.label === pkg.label ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-2xl shadow-primary/10" : "bg-black/60 border-white/5"
                                )}
                              >
                                 <div className="flex flex-col items-center text-center space-y-4">
                                    <div className={cn(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                                      selectedPackage?.label === pkg.label ? "bg-primary text-white" : "bg-white/5 text-muted-foreground"
                                    )}>
                                       <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-white uppercase tracking-tighter">{pkg.label}</p>
                                       <p className="text-2xl font-headline font-black text-primary mt-1">{pkg.cost} 🪙</p>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t border-white/5 w-full">
                                       <div className="flex items-center justify-center gap-2">
                                          <MapPin className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-[10px] font-bold text-white/80">{pkg.regions} Wilayah Indonesia</span>
                                       </div>
                                       <div className="flex items-center justify-center gap-2">
                                          <Clock className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-[10px] font-bold text-white/80">7 Hari Distribusi</span>
                                       </div>
                                    </div>
                                 </div>
                              </Card>
                            ))}
                         </div>

                         <div className="pt-6 flex justify-center">
                            <Button 
                              onClick={handleStartCampaign}
                              disabled={isStartingCampaign || !selectedPackage}
                              className="h-16 px-16 rounded-2xl luxury-gradient font-black text-xl shadow-2xl shadow-primary/30 group"
                            >
                               🚀 SEBAR TRAFIK
                               <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                            </Button>
                         </div>
                      </div>
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      )}

      {/* --- Modals --- */}

      {/* Activation Progress Dialog */}
      <Dialog open={!!isActivating} onOpenChange={() => {}}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-10 text-center max-w-md">
           <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-center">Otorisasi Premium</DialogTitle>
           </DialogHeader>
           <div className="space-y-8 py-6">
              <div className="relative w-24 h-24 mx-auto">
                 <Loader2 className="w-full h-full text-primary animate-spin opacity-20" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-muted-foreground text-sm">
                   {[
                     "Memverifikasi saldo...",
                     "Menyiapkan modul premium...",
                     "Mengaktifkan layanan..."
                   ][activationStep - 1] || "Memproses..."}
                 </p>
              </div>
              <Progress value={(activationStep / 3) * 100} className="h-2 bg-white/5" />
           </div>
        </DialogContent>
      </Dialog>

      {/* Start Campaign Progress Dialog */}
      <Dialog open={isStartingCampaign} onOpenChange={() => {}}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-10 text-center max-w-xl">
           <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold text-center">Menyiapkan Kampanye</DialogTitle>
           </DialogHeader>
           <div className="space-y-8 py-4">
              <div className="relative w-24 h-24 mx-auto">
                 <Rocket className="h-16 w-16 text-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                 <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
              <div className="space-y-2">
                 <p className="text-muted-foreground text-sm">
                   {[
                     "Membuat kampanye...",
                     "Menyiapkan distribusi...",
                     "Menyusun wilayah...",
                     "Mengaktifkan monitoring..."
                   ][campaignStep - 1] || "Menginisialisasi..."}
                 </p>
              </div>
              
              {generatedRegions.length > 0 && (
                <div className="bg-white/5 rounded-2xl p-4 max-h-[150px] overflow-y-auto space-y-2 text-left">
                   <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3">Wilayah Terdistribusi:</p>
                   <div className="grid grid-cols-2 gap-2">
                     {generatedRegions.map((city, idx) => (
                       <div key={idx} className="flex items-center gap-2 text-xs text-white/70 animate-in slide-in-from-left-2 duration-300">
                          <CheckCircle2 className="h-3 w-3 text-green-500" /> {city}
                       </div>
                     ))}
                   </div>
                </div>
              )}

              <Progress value={(campaignStep / 4) * 100} className="h-2 bg-white/5" />
           </div>
        </DialogContent>
      </Dialog>

      {/* How To Use Dialog */}
      <Dialog open={showHowTo} onOpenChange={setShowHowTo}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-10 max-w-lg">
           <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold flex items-center gap-3">
                 <Info className="h-6 w-6 text-primary" /> Panduan Penggunaan
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">Ikuti langkah berikut untuk mengoptimalkan eksposur akun Anda.</DialogDescription>
           </DialogHeader>
           <div className="py-6 space-y-6">
              {[
                { step: 1, text: "Aktifkan Premium atau Pro sesuai kebutuhan kapasitas Anda." },
                { step: 2, text: "Masukkan Link Profil Shopee Video Anda yang valid." },
                { step: 3, text: "Klik Cek Profil untuk memverifikasi metadata akun." },
                { step: 4, text: "Pilih Paket Wilayah (semakin banyak wilayah, semakin luas jangkauan)." },
                { step: 5, text: "Klik Sebar Trafik untuk memulai kampanye distribusi." },
                { step: 6, text: "Pantau laporan distribusi harian di dashboard monitoring." },
                { step: 7, text: "Tunggu hingga kampanye 7 hari selesai untuk membuat kampanye baru." }
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 group">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                      {item.step}
                   </div>
                   <p className="text-sm text-white/80 leading-relaxed group-hover:text-white transition-colors">{item.text}</p>
                </div>
              ))}
           </div>
           <DialogFooter>
              <Button onClick={() => setShowHowTo(false)} className="w-full h-12 rounded-xl luxury-gradient font-bold">MENGERTI</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
