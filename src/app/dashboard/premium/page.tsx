"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  TrendingUp, 
  Star, 
  BarChart3, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  ShoppingBag,
  Info
} from "lucide-react"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { PremiumStatusCard } from "@/components/premium/PremiumStatusCard"
import { ProductTrendCard } from "@/components/premium/ProductTrendCard"
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal"
import { isPremiumActive } from "@/lib/premium-subscription-service"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function PremiumResearchPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [keyword, setKeyword] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const profileRef = React.useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  const isPremium = isPremiumActive(profile?.premiumSubscription)

  const handleSearch = async () => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

    if (!keyword || keyword.trim().length < 2) {
      toast({ variant: "destructive", title: "Keyword Terlalu Pendek", description: "Masukkan minimal 2 karakter." })
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch('/api/premium/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProducts(data)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mencari", description: err.message })
    } finally {
      setIsSearching(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Menyiapkan Ruang Premium...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-14 h-14 rounded-[1.5rem] luxury-gradient flex items-center justify-center shadow-2xl shadow-amber-500/20">
                <BarChart3 className="text-white h-7 w-7" />
             </div>
             <div>
                <h2 className="text-4xl font-headline font-bold text-white tracking-tight">Reset Produk Premium 📈</h2>
                <p className="text-muted-foreground text-lg">Analisis pasar Shopee & TikTok secara mendalam di seluruh Indonesia.</p>
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

      {/* Search Section */}
      <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden shadow-2xl">
         <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl text-white flex items-center gap-2">
               <Search className="h-5 w-5 text-amber-500" /> Reset Keyword Produk
            </CardTitle>
            <CardDescription>Cari tren penjualan tertinggi untuk strategi inventory Anda.</CardDescription>
         </CardHeader>
         <CardContent className="p-8 pt-0 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Contoh: Gamis, Mukena, Kemeja Pria..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-white/5 border-white/10 h-16 rounded-2xl pl-12 text-lg text-white focus:border-amber-500/50 focus:ring-amber-500/10"
                  />
               </div>
               <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="h-16 px-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-lg shadow-xl transition-all active:scale-95"
               >
                 {isSearching ? <Loader2 className="animate-spin" /> : "RISET SEKARANG"}
               </Button>
            </div>

            <div className="flex flex-wrap gap-2">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mr-2 flex items-center">Populer:</p>
               {["Hijab", "Sandal Wanita", "Gamis", "Daster", "Celana"].map((k) => (
                 <button 
                  key={k} 
                  onClick={() => setKeyword(k)}
                  className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-white/60 hover:border-amber-500/50 hover:text-amber-500 transition-all"
                 >
                   {k}
                 </button>
               ))}
            </div>
         </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-headline font-bold text-white flex items-center gap-3">
               <TrendingUp className="h-6 w-6 text-green-500" /> Hasil Analisis Produk
            </h3>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Menampilkan 5 Data Teratas</p>
         </div>

         {isSearching ? (
           <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-4">
                   <Skeleton className="aspect-square rounded-[2rem] bg-white/5" />
                   <Skeleton className="h-4 w-3/4 bg-white/5" />
                   <Skeleton className="h-10 w-full rounded-xl bg-white/5" />
                </div>
              ))}
           </div>
         ) : products.length === 0 ? (
           <div className="p-20 text-center space-y-4 bg-black/20 rounded-[3rem] border border-dashed border-white/5">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                 <ShoppingBag className="h-10 w-10" />
              </div>
              <p className="text-muted-foreground italic">Gunakan riset keyword untuk menampilkan data tren penjualan.</p>
           </div>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {products.map((p) => (
                <ProductTrendCard key={p.id} product={p} />
              ))}
           </div>
         )}
      </div>

      {/* Info Warning */}
      {!isPremium && (
        <div className="p-8 rounded-[3rem] bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                 <Info className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                 <h4 className="text-lg font-bold text-white">Buka Seluruh Potensi Riset</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">Dapatkan data penjualan real-time, tren harian, dan analisis kompetitor Shopee & TikTok dengan fitur Premium.</p>
              </div>
           </div>
           <Button onClick={() => setShowUpgradeModal(true)} variant="outline" className="h-12 px-8 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-black">
              PELAJARI PAKET
           </Button>
        </div>
      )}

      {/* Upgrade Modal */}
      <PremiumUpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
        userCoins={profile?.coins || 0} 
      />
    </div>
  )
}
