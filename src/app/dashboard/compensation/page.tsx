
"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Search, 
  Calculator, 
  TrendingUp, 
  ShieldAlert, 
  MessageCircle, 
  History, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Coins,
  Wallet,
  Zap,
  TrendingDown
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase"
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { isPremiumActive } from "@/lib/premium-subscription-service"

const DURATION_DAYS = [
  { label: "2 Minggu", value: "14" },
  { label: "3 Minggu", value: "21" },
  { label: "1 Bulan", value: "30" },
]

const RATE_PACKETS = [
  { label: "100rb - 200rb", coins: 370 },
  { label: "200rb - 300rb", coins: 650 },
  { label: "300rb - 400rb", coins: 750 },
  { label: "600rb - 700rb", coins: 850 },
  { label: "Up to 1jt", coins: 1050 },
]

export default function CompensationAdminPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // State for simulation inputs
  const [selectedDuration, setSelectedDuration] = useState<string>("14")
  const [selectedRatePacket, setSelectedRatePacket] = useState<string>("370")
  const [dailyAdsCost, setDailyAdsCost] = useState<number>(0)
  const [userRevenue, setUserRevenue] = useState<number>(0)
  const [googleDriveLink, setGoogleDriveLink] = useState("")

  // 1. Fetch user data & premium status
  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile } = useDoc(profileRef)
  
  const isPremium = profile?.premiumBadge === true || 
                    ['premium', 'private', 'vip', 'mbah paijo'].includes(profile?.role?.toLowerCase()) || 
                    isPremiumActive(profile?.premiumSubscription);

  // 2. Fetch last Inject Ads campaign for reference
  const campaignQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "inject_ads_campaigns"),
      where("userId", "==", user.uid),
      orderBy("startedAt", "desc"),
      limit(1)
    )
  }, [db, user?.uid])
  
  const { data: campaigns, loading: campaignLoading } = useCollection<any>(campaignQuery)
  const lastCampaign = campaigns?.[0]

  // Update initial simulation state if last campaign exists
  useEffect(() => {
    if (lastCampaign) {
      if (lastCampaign.durationLabel?.includes("2 Minggu")) setSelectedDuration("14");
      else if (lastCampaign.durationLabel?.includes("3 Minggu")) setSelectedDuration("21");
      else if (lastCampaign.durationLabel?.includes("1 Bulan")) setSelectedDuration("30");
      
      const matchedPacket = RATE_PACKETS.find(p => p.label === lastCampaign.rateLabel);
      if (matchedPacket) setSelectedRatePacket(matchedPacket.coins.toString());
    }
  }, [lastCampaign]);

  // 3. Calculation Logic
  const coinPrice = isPremium ? 2000 : 3000
  const totalCoins = parseInt(selectedRatePacket)
  const coinValueRupiah = totalCoins * coinPrice

  const campaignDays = parseInt(selectedDuration)
  const totalAdsCost = dailyAdsCost * campaignDays
  
  const totalCapital = coinValueRupiah + totalAdsCost
  const diff = userRevenue - totalCapital
  const isProfitable = diff >= 0
  const diffAbs = Math.abs(diff)
  const percentage = totalCapital > 0 ? (diffAbs / totalCapital) * 100 : 0

  // 4. Drive Link Validation
  const isDriveValid = googleDriveLink.includes("drive.google.com")

  const handleSendToAdmin = () => {
    if (!googleDriveLink || !isDriveValid) {
      toast({ variant: "destructive", title: "Link Tidak Valid", description: "Masukkan link Google Drive yang benar." })
      return
    }
    if (userRevenue <= 0) {
      toast({ variant: "destructive", title: "Input Salah", description: "Masukkan hasil pendapatan campaign Anda." })
      return
    }

    const adminPhone = "6282131974325"
    const durationLabel = DURATION_DAYS.find(d => d.value === selectedDuration)?.label
    const rateLabel = RATE_PACKETS.find(r => r.coins.toString() === selectedRatePacket)?.label

    const message = `Halo Admin Nexvora,\n\nSaya ingin mengajukan evaluasi kompensasi untuk campaign Inject Ads.\n\n` +
      `Email User: ${user?.email}\n` +
      `Jenis Member: ${isPremium ? "PREMIUM" : "REGULAR"}\n` +
      `Durasi Campaign: ${durationLabel}\n` +
      `Rate Penghasilan: ${rateLabel}\n` +
      `Total Koin: ${totalCoins}\n` +
      `Nilai Koin (Rupiah): Rp ${coinValueRupiah.toLocaleString()}\n` +
      `Biaya Ads Harian: Rp ${dailyAdsCost.toLocaleString()}\n` +
      `Total Biaya Ads: Rp ${totalAdsCost.toLocaleString()}\n` +
      `Total Modal Campaign: Rp ${totalCapital.toLocaleString()}\n` +
      `Hasil Pendapatan User: Rp ${userRevenue.toLocaleString()}\n` +
      `Selisih: Rp ${diffAbs.toLocaleString()} (${isProfitable ? "PROFIT" : "LOSS"})\n` +
      `Persentase: ${percentage.toFixed(2)}%\n` +
      `Link Google Drive: ${googleDriveLink}\n` +
      `Tanggal Pengajuan: ${new Date().toLocaleDateString()}\n\n` +
      `Mohon bantuannya untuk dilakukan pengecekan. Terima kasih.`;

    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (campaignLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline mt-4">Menganalisis data simulasi...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-2xl luxury-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <FileText className="text-white h-6 w-6" />
           </div>
           <h2 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">Kompensasi Admin 📋</h2>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl">Pengajuan evaluasi hasil campaign Inject Ads berdasarkan analisis Modal vs Pendapatan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Simulation Controls */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-0">
               <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" /> Simulasi Nilai Kompensasi
               </CardTitle>
               <CardDescription>Sesuaikan parameter di bawah ini untuk melihat analisis modal Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                     <Zap className="h-5 w-5 text-primary" />
                     <span className="text-xs font-bold text-white uppercase">Tipe Member</span>
                  </div>
                  <Badge className={cn("px-4 py-1 border-none font-black text-[10px] uppercase", isPremium ? "bg-amber-500 text-black" : "bg-white/10 text-white")}>
                     {isPremium ? "PREMIUM (1 Koin = Rp2rb)" : "REGULAR (1 Koin = Rp3rb)"}
                  </Badge>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Durasi Campaign</Label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-white/10 text-white">
                        {DURATION_DAYS.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Paket Inject Ads (Rate)</Label>
                    <Select value={selectedRatePacket} onValueChange={setSelectedRatePacket}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-white/10 text-white">
                        {RATE_PACKETS.map(p => (
                          <SelectItem key={p.coins} value={p.coins.toString()}>{p.label} ({p.coins} Koin)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Biaya Ads Harian (Rp)</Label>
                     <div className="relative">
                        <Input 
                           type="number"
                           placeholder="Contoh: 25000"
                           value={dailyAdsCost || ""}
                           onChange={(e) => setDailyAdsCost(parseInt(e.target.value) || 0)}
                           className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 text-white focus:border-primary/50 text-lg font-bold"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">Rp</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Hasil Pendapatan Campaign (Rp)</Label>
                     <div className="relative">
                        <Input 
                           type="number"
                           placeholder="Masukkan total pendapatan dari Shopee..."
                           value={userRevenue || ""}
                           onChange={(e) => setUserRevenue(parseInt(e.target.value) || 0)}
                           className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 text-white focus:border-primary/50 text-lg font-bold"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">Rp</span>
                     </div>
                  </div>
               </div>

               <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 space-y-6">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-muted-foreground font-medium">Nilai Koin ({totalCoins} 🪙)</span>
                     <span className="text-white font-bold">Rp {coinValueRupiah.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-muted-foreground font-medium">Total Biaya Ads ({campaignDays} Hari)</span>
                     <span className="text-white font-bold">+ Rp {totalAdsCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                     <span className="font-headline font-bold text-white">Total Modal Campaign</span>
                     <span className="text-2xl font-headline font-black text-primary">Rp {totalCapital.toLocaleString()}</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Analysis & Form */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="premium-card rounded-[2.5rem] bg-black/60 border-white/5 overflow-hidden">
             <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                   <TrendingUp className="h-5 w-5 text-primary" /> Analisis Hasil
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="text-center space-y-6">
                   <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Status Evaluasi</p>
                   
                   {userRevenue > 0 ? (
                     <div className="space-y-4">
                        <div className={cn(
                          "p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all duration-500",
                          isProfitable ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                           {isProfitable ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
                           <p className="font-headline font-black text-lg uppercase tracking-tight">
                              {isProfitable ? "Campaign Menguntungkan" : "Perlu Evaluasi Kompensasi"}
                           </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[9px] text-muted-foreground uppercase font-black mb-1">Total {isProfitable ? 'Untung' : 'Rugi'}</p>
                              <p className={cn("text-lg font-bold", isProfitable ? "text-green-500" : "text-red-500")}>
                                 Rp {diffAbs.toLocaleString()}
                              </p>
                           </div>
                           <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[9px] text-muted-foreground uppercase font-black mb-1">Persentase</p>
                              <p className={cn("text-lg font-bold", isProfitable ? "text-green-500" : "text-red-500")}>
                                 {percentage.toFixed(2)}%
                              </p>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="p-10 rounded-[2rem] bg-white/5 border border-dashed border-white/10 text-white/30 text-sm italic">
                        Menunggu input pendapatan untuk memulai analisis...
                     </div>
                   )}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                   <Label className="text-[10px] font-black uppercase text-white/40 ml-1">Link Google Drive Bukti Video</Label>
                   <Input 
                      placeholder="https://drive.google.com/..."
                      value={googleDriveLink}
                      onChange={(e) => setGoogleDriveLink(e.target.value)}
                      className={cn(
                        "bg-white/5 border-white/10 h-12 rounded-xl text-sm",
                        googleDriveLink && !isDriveValid && "border-red-500/50"
                      )}
                   />
                   <p className="text-[9px] text-muted-foreground leading-relaxed px-1">
                      * Pastikan link Google Drive dapat diakses oleh admin (Set Public).
                   </p>
                </div>

                <Button 
                   onClick={handleSendToAdmin}
                   disabled={!googleDriveLink || !isDriveValid || userRevenue <= 0}
                   className="w-full h-16 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group"
                >
                   KIRIM KE ADMIN <MessageCircle className="ml-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                </Button>
             </CardContent>
          </Card>

          {/* Warning Box */}
          <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 space-y-4">
             <div className="flex items-center gap-3 text-primary">
                <ShieldAlert className="h-6 w-6" />
                <span className="font-headline font-bold uppercase tracking-widest text-sm">Peringatan Penting</span>
             </div>
             <ul className="space-y-3 text-[11px] text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">• Analisis ini bersifat simulasi untuk mempermudah audit admin.</li>
                <li className="flex items-start gap-3">• Keputusan akhir kompensasi sepenuhnya wewenang tim Nexvora.</li>
                <li className="flex items-start gap-3">• Verifikasi dilakukan secara manual berdasarkan bukti video Shopee Affiliate.</li>
                <li className="flex items-start gap-3 text-red-500 font-bold italic">• Segala bentuk pemalsuan data akan berakibat pada penonaktifan akun secara permanen.</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
