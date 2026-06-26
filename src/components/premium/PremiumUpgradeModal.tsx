"use client"

import React, { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, CheckCircle2, Zap, Loader2, Sparkles } from "lucide-react"
import { PREMIUM_PACKAGES } from "@/lib/constants"
import { buyPremiumPlan } from "@/lib/premium-subscription-service"
import { useFirestore, useUser } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PremiumUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userCoins: number
}

export function PremiumUpgradeModal({ open, onOpenChange, userCoins }: PremiumUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<any>(PREMIUM_PACKAGES[1])
  const [isLoading, setIsLoading] = useState(false)
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const handlePurchase = async () => {
    if (!db || !user || !selectedPlan) return
    
    setIsLoading(true)
    try {
      await buyPremiumPlan(db, user.uid, selectedPlan, userCoins)
      toast({ title: "Premium Aktif! ✨", description: `Selamat! Paket ${selectedPlan.label} telah aktif.` })
      onOpenChange(false)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Aktivasi", description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/95 border-amber-500/20 text-white rounded-[2.5rem] p-8 md:p-10 max-w-xl">
        <DialogHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-amber-500/20 shadow-2xl shadow-amber-500/10">
            <Star className="text-amber-500 h-10 w-10 fill-amber-500" />
          </div>
          <DialogTitle className="text-3xl font-headline font-bold">🔒 Fitur Premium</DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Aktifkan Premium untuk membuka Reset Produk, Tren Penjualan, dan Analisis Pasar Mendalam.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
           {PREMIUM_PACKAGES.map((pkg) => (
             <div 
              key={pkg.id}
              onClick={() => setSelectedPlan(pkg)}
              className={cn(
                "p-4 rounded-3xl border-2 transition-all cursor-pointer text-center space-y-1",
                selectedPlan?.id === pkg.id 
                  ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10" 
                  : "bg-white/5 border-white/5 hover:border-white/20"
              )}
             >
                <p className="text-[10px] font-black uppercase text-white/60">{pkg.label}</p>
                <p className="text-xl font-headline font-black text-amber-500">{pkg.cost}</p>
                <p className="text-[8px] font-bold text-white/40 uppercase">Koin</p>
             </div>
           ))}
        </div>

        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center">Keuntungan Premium:</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Reset Produk Shopee",
                "Tren Penjualan Harian",
                "Tren Penjualan Mingguan",
                "Tren Penjualan Bulanan",
                "5 Produk Terlaris",
                "Analisis Real-time Apify"
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                   <CheckCircle2 className="h-4 w-4 text-green-500" />
                   <span className="text-xs text-white/70 font-medium">{f}</span>
                </div>
              ))}
           </div>
        </div>

        <DialogFooter className="pt-8 flex flex-col gap-4 sm:flex-col sm:space-x-0">
          <Button 
            onClick={handlePurchase}
            disabled={isLoading || userCoins < (selectedPlan?.cost || 0)}
            className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 border-none font-black text-lg shadow-xl shadow-amber-500/20 group"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 h-6 w-6" /> AKTIFKAN SEKARANG</>}
          </Button>
          <div className="text-center">
             <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
               Saldo Koin Anda: <span className={cn(userCoins < (selectedPlan?.cost || 0) ? "text-red-500" : "text-amber-500")}>{userCoins} 🪙</span>
             </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
