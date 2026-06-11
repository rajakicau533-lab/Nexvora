"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Rocket, 
  ChevronLeft, 
  Link as LinkIcon, 
  Users, 
  Trophy, 
  Zap, 
  History 
} from "lucide-react"
import Link from "next/link"

export default function ReferralRewardComingSoonPage() {
  const upcomingFeatures = [
    { label: "Link referral unik", icon: LinkIcon },
    { label: "Riwayat teman yang diundang", icon: Users },
    { label: "Reward 20% dari koin referral", icon: Trophy },
    { label: "Statistik referral", icon: Zap },
    { label: "Claim reward", icon: History },
  ]

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />
      </div>

      <Card className="premium-card max-w-2xl w-full rounded-[2.5rem] border-white/5 bg-black/60 backdrop-blur-2xl overflow-hidden relative z-10 shadow-2xl">
        <CardHeader className="pt-12 pb-6 text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl shadow-primary/20 animate-bounce">
            <Rocket className="text-primary h-10 w-10" />
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-4 py-1 font-black tracking-widest text-[10px] uppercase">
              COMING SOON
            </Badge>
            <CardTitle className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">
              Referral Reward
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 md:px-12 pb-12 space-y-8 text-center">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Fitur <span className="text-white font-bold">Referral Reward</span> sedang dalam tahap pengembangan intensif dan akan segera tersedia untuk seluruh member Nexvora.
          </p>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/5 text-left space-y-4">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Fitur yang akan hadir:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                    <feature.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm text-white/70 font-medium group-hover:text-white transition-colors">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button asChild className="w-full h-14 rounded-2xl luxury-gradient font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 
              KEMBALI KE DASHBOARD
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
