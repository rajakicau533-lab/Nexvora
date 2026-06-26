
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Rocket } from "lucide-react"

/**
 * @fileOverview Halaman Riset Produk Premium (Coming Soon Mode)
 * Menggantikan fitur scraping realtime yang tidak stabil dengan pengumuman pengembangan.
 */
export default function PremiumResearchPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4 animate-in fade-in duration-700">
      <Card className="premium-card w-full max-w-md rounded-[2.5rem] bg-black/60 border-white/5 overflow-hidden shadow-2xl h-[280px] flex flex-col justify-center relative">
        {/* Background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
        
        <CardContent className="p-8 text-center space-y-6 relative z-10">
          <div className="space-y-4">
             <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
                <Rocket className="h-6 w-6 text-primary" />
             </div>
             
             <div className="flex flex-col items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-0.5 text-[9px] font-black tracking-widest uppercase">
                  COMING SOON
                </Badge>
                <h2 className="text-2xl font-headline font-bold text-white tracking-tight">Riset Produk Premium</h2>
             </div>
             
             <p className="text-xs text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
               Fitur analisis produk premium sedang dalam tahap pengembangan dan akan segera dirilis untuk seluruh member.
             </p>
          </div>

          <div className="w-full max-w-[240px] mx-auto space-y-2">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">Status Pengembangan</span>
                <span className="text-[10px] font-black text-primary uppercase">75%</span>
             </div>
             <Progress value={75} className="h-1.5 bg-white/5 rounded-full overflow-hidden" />
          </div>

          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] pt-4">
            Nexvora Premium Labs
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
