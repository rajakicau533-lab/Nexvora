
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Rocket, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function PremiumError() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="premium-card max-w-2xl w-full rounded-[3rem] bg-black/60 border-amber-500/10 overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 right-0 p-8">
          <Badge className="bg-amber-500 text-black font-black uppercase text-[10px] px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
            <Clock className="h-3 w-3 mr-2 inline" /> COMING SOON
          </Badge>
        </div>
        <CardContent className="flex flex-col items-center justify-center p-16 text-center space-y-8">
          <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center border border-amber-500/20 shadow-2xl shadow-amber-500/10 animate-pulse">
            <Rocket className="text-amber-500 h-12 w-12" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl md:text-4xl font-headline font-black text-white tracking-tight">
              🚀 Premium Feature Coming Soon
            </h3>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Fitur riset produk premium sedang dalam pemeliharaan singkat atau tahap pengembangan akhir. Kami akan segera kembali!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
