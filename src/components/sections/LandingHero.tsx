"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, LogIn, Zap, Crown, Shield, Activity, Users, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONTACT_INFO } from "@/lib/constants"

export function LandingHero() {
  return (
    <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 overflow-hidden px-4">
      {/* Glow Effects */}
      <div className="absolute top-[20%] left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 blur-[80px] md:blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-red-600/5 blur-[70px] md:blur-[130px] rounded-full pointer-events-none" />
      
      {/* Background Matrix Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/80">Digital Platform v2.0</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-black text-white leading-[1.1] tracking-tight">
              Nexvora <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-500 to-red-800">Studio.</span>
            </h1>

            <p className="text-base md:text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
              Platform digital profesional untuk membantu <span className="text-white font-bold">creator & seller</span> meningkatkan performa akun dan penjualan dengan tools otomatis tercepat.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-10 rounded-2xl luxury-gradient border-none font-black text-base md:text-lg shadow-2xl shadow-primary/30 group">
                <Link href="/auth/register" className="flex items-center gap-2">
                  MULAI SEKARANG <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-base md:text-lg backdrop-blur-md">
                <Link href="/auth/login" className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" /> LOGIN
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5">
               <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">Secured</span>
               </div>
               <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">Instant</span>
               </div>
               <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">Realtime</span>
               </div>
            </div>
          </div>

          {/* Desktop Visual Mockup */}
          <div className="hidden lg:block relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
            <div className="relative z-10 p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 overflow-hidden">
               <div className="bg-black/60 rounded-[1.5rem] overflow-hidden border border-white/5">
                  <img 
                    src="https://picsum.photos/seed/nexvora-dash/800/600" 
                    data-ai-hint="dashboard dark" 
                    alt="Nexvora Dashboard Mockup" 
                    className="w-full h-auto opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
               </div>
               {/* Floating elements */}
               <div className="absolute -top-6 -left-6 bg-primary p-4 rounded-2xl shadow-2xl animate-bounce">
                  <Crown className="h-6 w-6 text-white" />
               </div>
               <div className="absolute -bottom-4 -right-4 bg-green-500 p-4 rounded-2xl shadow-2xl">
                  <Zap className="h-6 w-6 text-white" />
               </div>
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[120px] rounded-full -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}