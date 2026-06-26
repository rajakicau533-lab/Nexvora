"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  Star, 
  Rocket, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Bell, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  LineChart,
  ShoppingBag,
  Coins
} from "lucide-react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { PremiumStatusCard } from "@/components/premium/PremiumStatusCard"
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal"
import { isPremiumActive } from "@/lib/premium-subscription-service"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function PremiumResearchPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [isNotified, setIsNotified] = useState(false)

  const profileRef = React.useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const isPremium = isPremiumActive(profile?.premiumSubscription)

  const handleNotifyMe = () => {
    setIsNotified(true)
    toast({ 
      title: "Notifikasi Diaktifkan! 🔔", 
      description: "Anda akan mendapatkan notifikasi saat fitur ini tersedia." 
    })
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Menyiapkan Ruang Premium...</p>
      </div>
    )
  }

  const features = [
    { label: "Analisis produk terlaris", icon: TrendingUp },
    { label: "Estimasi penjualan harian", icon: Zap },
    { label: "Estimasi penjualan mingguan", icon: LineChart },
    { label: "Estimasi penjualan bulanan", icon: BarChart3 },
    { label: "Analisis kompetitor", icon: ShieldCheck },
    { label: "Analisis harga pasar", icon: Coins },
    { label: "Analisis tren kategori", icon: Sparkles },
    { label: "Gambar produk otomatis", icon: CheckCircle2 },
    { label: "Data produk terjual", icon: ShoppingBag },
    { label: "Skor peluang produk", icon: Star },
  ]

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20 animate-in fade-in duration-700">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-14 h-14 rounded-[1.5rem] luxury-gradient flex items-center justify-center shadow-2xl shadow-amber-500/20 border border-amber-500/30">
                <BarChart3 className="text-white h-7 w-7" />
             </div>
             <div>
                <h2 className="text-4xl font-headline font-bold text-white tracking-tight">Riset Produk Premium 📈</h2>
                <p className="text-muted-foreground text-lg">Gunakan algoritma Nexvora untuk memetakan produk terlaris di pasar.</p>
             </div>
          </div>
        </div>
        
        {isPremium ? (
          <div className="w-full lg:w-96">
             <PremiumStatusCard subscription={profile?.premiumSubscription} />
          </div>
        ) : (
          <Button 
            onClick={() => setShowUpgradeModal(true)}
            className="h-16 px-10 rounded-[1.5rem] bg-amber-500 hover:bg-amber-600 border-none font-black text-lg shadow-xl shadow-amber-500/20 group"
          >
             <Star className="mr-2 h-6 w-6 fill-white animate-pulse" /> AKTIFKAN PREMIUM
          </Button>
        )}
      </div>

      {/* Main Coming Soon Container */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="premium-card rounded-[3rem] bg-black/60 border-amber-500/10 overflow-hidden relative shadow-2xl min-h-[600px] flex flex-col">
             <div className="absolute top-0 right-0 p-8">
                <Badge className="bg-amber-500 text-black font-black uppercase text-[10px] px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
                  <Clock className="h-3 w-3 mr-2 inline" /> COMING SOON
                </Badge>
             </div>

             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-600/5 pointer-events-none" />

             <CardContent className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center space-y-8 relative z-10">
                <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center border border-amber-500/20 shadow-2xl shadow-amber-500/10 animate-bounce">
                  <Rocket className="text-amber-500 h-12 w-12" />
                </div>
                
                <div className="space-y-3">
                   <h3 className="text-3xl md:text-5xl font-headline font-black text-white tracking-tight">
                     Riset Produk <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Premium</span>
                   </h3>
                   <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                     Fitur analisis produk realtime sedang dalam tahap pengembangan intensif dan akan segera hadir untuk seluruh member premium.
                   </p>
                </div>

                <div className="w-full max-w-md space-y-4">
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Development Progress</span>
                      <span className="text-lg font-headline font-black text-white">70%</span>
                   </div>
                   <Progress value={70} className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" />
                   </Progress>
                </div>

                <div className="pt-6">
                   <Button 
                    onClick={handleNotifyMe}
                    disabled={isNotified}
                    className={cn(
                      "h-16 px-12 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 group",
                      isNotified ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-white text-black hover:bg-white/90"
                    )}
                   >
                     {isNotified ? (
                       <><CheckCircle2 className="mr-2 h-6 w-6" /> BERHASIL DIDAFTARKAN</>
                     ) : (
                       <><Bell className="mr-2 h-6 w-6" /> BERI NOTIFIKASI SAAT RILIS</>
                     )}
                   </Button>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-[2.5rem] bg-black/60 border-white/5 overflow-hidden flex flex-col h-full">
             <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                   <Sparkles className="h-5 w-5 text-amber-500" /> Fitur yang Akan Hadir
                </CardTitle>
                <CardDescription>Semua yang Anda butuhkan untuk memenangkan pasar.</CardDescription>
             </CardHeader>
             <CardContent className="p-8 space-y-4 flex-1">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                           <f.icon className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                        </div>
                        <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">{f.label}</span>
                     </div>
                     <CheckCircle2 className="h-4 w-4 text-amber-500/30 group-hover:text-amber-500 transition-colors" />
                  </div>
                ))}
             </CardContent>
             <div className="p-8 pt-0 mt-auto">
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                   <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-500 uppercase">Jaminan Kualitas</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Kami sedang menyempurnakan algoritma agar data yang ditampilkan 100% akurat dan anti-blokir.
                      </p>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </div>

      <PremiumUpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
        userCoins={profile?.coins || 0} 
      />
    </div>
  )
}
