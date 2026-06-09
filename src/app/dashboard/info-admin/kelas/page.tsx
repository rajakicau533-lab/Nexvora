"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, MessageCircle, Star, Sparkles, ShieldCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const packages = [
  {
    name: "Premium",
    price: "100K",
    features: ["Materi", "Diskusi", "Shopee Video", "TikTok"],
    waText: "Halo Admin, saya ingin daftar Kelas Premium 100K",
    popular: false,
    color: "from-blue-500/20 to-transparent"
  },
  {
    name: "Private",
    price: "450K",
    features: ["Materi", "Diskusi", "Shopee Video", "TikTok", "Tools", "Gratis Premium", "Prioritas"],
    waText: "Halo Admin, saya ingin daftar Kelas Private 450K",
    popular: true,
    color: "from-primary/20 to-transparent"
  },
  {
    name: "VIP",
    price: "900K",
    features: ["Materi", "Diskusi", "Shopee Video", "TikTok", "Tools", "Gratis Premium", "Shopee Live", "Shopee Medsos"],
    waText: "Halo Admin, saya ingin daftar Kelas VIP 900K",
    popular: false,
    color: "from-amber-500/20 to-transparent"
  },
  {
    name: "Mbah Paijo",
    price: "1,5 JT",
    features: ["Materi", "Diskusi", "Shopee Video", "TikTok", "Tools", "Gratis Premium", "Shopee Live", "Shopee Medsos"],
    waText: "Halo Admin, saya ingin daftar Kelas Mbah Paijo 1,5JT",
    popular: false,
    color: "from-yellow-600/20 to-transparent"
  }
]

export default function InfoKelasPage() {
  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
      {/* Banner Section */}
      <div className="relative w-full rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/5 shadow-2xl">
        <div className="aspect-[21/9] md:aspect-[3/1] relative">
          <img 
            src="https://picsum.photos/seed/nexvorakelas/1200/400" 
            alt="Nexvora Academy" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12 space-y-2">
            <Badge className="bg-primary text-[10px] font-black tracking-widest uppercase px-4 py-1">Nexvora Academy</Badge>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-white">Upgrade Skill Kamu <br /><span className="text-primary">Sekarang Juga!</span></h1>
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <h2 className="text-3xl font-headline font-bold text-white">Pilih Paket Belajar</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">Investasi terbaik adalah untuk diri sendiri. Pilih paket yang sesuai dengan kebutuhan pertumbuhan digital Anda.</p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
        {packages.map((pkg, idx) => (
          <Card 
            key={idx} 
            className={cn(
              "premium-card rounded-[2rem] bg-black/60 flex flex-col border-white/5 transition-all duration-500 hover:scale-[1.02] hover:border-primary/40 relative overflow-hidden",
              pkg.popular && "border-primary/30 shadow-[0_0_40px_rgba(220,38,38,0.1)]"
            )}
          >
            <div className={cn("absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b opacity-50", pkg.color)} />
            
            {pkg.popular && (
              <div className="absolute top-4 right-4">
                <Badge className="luxury-gradient text-[10px] font-black uppercase px-3 py-1 rounded-full">Terpopuler</Badge>
              </div>
            )}

            <CardHeader className="relative pt-10 text-center space-y-2">
              <CardTitle className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em]">{pkg.name}</CardTitle>
              <div className="flex items-center justify-center gap-1">
                <span className="text-4xl font-headline font-black text-white">{pkg.price}</span>
              </div>
            </CardHeader>

            <CardContent className="relative flex-1 pt-6 space-y-6">
              <div className="space-y-4">
                {pkg.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    </div>
                    <span className="text-sm text-white/80 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="relative pb-10 px-6">
              <Button 
                asChild
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-base shadow-xl transition-all group",
                  pkg.popular ? "luxury-gradient border-none shadow-primary/20" : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
              >
                <a href={`https://wa.me/6282131974325?text=${encodeURIComponent(pkg.waText)}`} target="_blank" rel="noopener noreferrer">
                  Daftar {pkg.name} <MessageCircle className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
        <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex items-center gap-5">
           <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Zap className="h-6 w-6 text-primary" />
           </div>
           <div>
              <h4 className="font-bold text-white">Akses Selamanya</h4>
              <p className="text-xs text-muted-foreground">Satu kali bayar untuk akses materi tanpa batas.</p>
           </div>
        </div>
        <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex items-center gap-5">
           <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="h-6 w-6 text-primary" />
           </div>
           <div>
              <h4 className="font-bold text-white">Grup Diskusi</h4>
              <p className="text-xs text-muted-foreground">Tanya jawab langsung dengan mentor & sesama member.</p>
           </div>
        </div>
        <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 flex items-center gap-5">
           <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="h-6 w-6 text-primary" />
           </div>
           <div>
              <h4 className="font-bold text-white">Materi Terupdate</h4>
              <p className="text-xs text-muted-foreground">Kurikulum yang selalu mengikuti algoritma terbaru.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
