"use client"

import React from "react"
import Link from "next/link"
import { Sparkles, ArrowRight, ShieldCheck, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-20 md:pt-32 md:pb-40">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-semibold tracking-wide backdrop-blur-sm">
            <Zap className="h-4 w-4 fill-primary" />
            <span>Digital Platform Masa Depan</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-foreground leading-[1.1] tracking-tight">
            Kembangkan Bisnis Digital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Lebih Cepat & Profesional
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nexvora Studio adalah platform digital modern yang menyediakan layanan trafik, creator AI, 
            marketplace digital, referral system, dan manajemen koin dalam satu dashboard profesional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-xl shadow-xl shadow-primary/20 luxury-gradient border-none hover:scale-105 transition-all">
              <Link href="/auth/register">
                Mulai Sekarang <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all">
              <Link href="/auth/login">Login Akun</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
            <div className="space-y-1">
              <p className="text-3xl font-headline font-bold text-foreground">15k+</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3 text-primary" /> Pengguna Aktif
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-headline font-bold text-foreground">2M+</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Zap className="h-3 w-3 text-primary" /> Trafik Diproses
              </p>
            </div>
            <div className="hidden md:block space-y-1">
              <p className="text-3xl font-headline font-bold text-foreground">99.9%</p>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" /> Sistem Aman
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
