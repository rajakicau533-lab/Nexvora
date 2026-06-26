"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, Clock, Zap } from "lucide-react"

interface PremiumStatusCardProps {
  subscription: any
}

export function PremiumStatusCard({ subscription }: PremiumStatusCardProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!subscription?.expiresAt) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const expiry = subscription.expiresAt.toDate ? subscription.expiresAt.toDate().getTime() : new Date(subscription.expiresAt).getTime()
      const start = subscription.activatedAt?.toDate ? subscription.activatedAt.toDate().getTime() : (expiry - 24 * 60 * 60 * 1000)
      
      const diff = expiry - now
      const total = expiry - start

      if (diff <= 0) {
        setTimeLeft(null)
        setProgress(0)
        clearInterval(timer)
        return
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000)
      })

      setProgress(Math.max(0, Math.min(100, (diff / total) * 100)))
    }, 1000)

    return () => clearInterval(timer)
  }, [subscription])

  if (!timeLeft) return null

  return (
    <Card className="premium-card rounded-[2.5rem] bg-black/60 border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Premium Aktif
          </CardTitle>
          <Badge className="bg-amber-500 text-black font-black uppercase text-[10px]">
            {subscription.tier || 'MEMBER'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Hari', val: timeLeft.d },
            { label: 'Jam', val: timeLeft.h },
            { label: 'Menit', val: timeLeft.m },
            { label: 'Detik', val: timeLeft.s }
          ].map((t, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <p className="text-2xl font-headline font-black text-amber-500 leading-none">{t.val.toString().padStart(2, '0')}</p>
              <p className="text-[8px] text-white/40 uppercase font-bold mt-1">{t.label}</p>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/60">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Durasi Paket</span>
              <span>{Math.round(progress)}%</span>
           </div>
           <Progress value={progress} className="h-1.5 bg-white/5" />
        </div>
      </CardContent>
    </Card>
  )
}
