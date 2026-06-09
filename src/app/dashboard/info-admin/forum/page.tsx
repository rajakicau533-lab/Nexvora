"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, MessageCircle, ArrowRight, ShieldCheck, Users, Zap } from "lucide-react"

export default function ForumPage() {
  return (
    <div className="space-y-8 max-w-[1000px] mx-auto py-10">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20 shadow-2xl shadow-green-500/10">
          <MessageSquare className="text-green-500 h-10 w-10" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-white">Forum Komunitas Nexvora</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Tempat berkumpulnya para kreator dan pebisnis digital Indonesia untuk saling berbagi inspirasi dan strategi.</p>
      </div>

      <Card className="premium-card rounded-[3rem] border-white/5 bg-black/40 overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2">
          <div className="p-10 md:p-16 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold text-white">Gabung Grup WhatsApp</h2>
              <p className="text-muted-foreground">Dapatkan update terbaru, tips harian, dan koneksi profesional secara instan.</p>
            </div>

            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                     <Zap className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Informasi Tercepat</h4>
                    <p className="text-xs text-muted-foreground">Berita update platform & algoritma.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                     <Users className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Jejaring Bisnis</h4>
                    <p className="text-xs text-muted-foreground">Temukan partner bisnis & kolaborasi.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                     <ShieldCheck className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Dukungan Admin</h4>
                    <p className="text-xs text-muted-foreground">Fast respon untuk kendala teknis.</p>
                  </div>
               </div>
            </div>

            <Button 
              asChild 
              size="lg" 
              className="w-full h-16 rounded-2xl bg-green-500 hover:bg-green-600 border-none font-black text-lg shadow-xl shadow-green-500/20 group"
            >
              <a href="https://chat.whatsapp.com/FskI1eDA6LY4Ni529OftRD" target="_blank" rel="noopener noreferrer">
                Gabung Grup Sekarang <MessageCircle className="ml-2 h-6 w-6 group-hover:scale-110 transition-transform" />
              </a>
            </Button>
          </div>
          <div className="relative hidden md:block bg-white/5">
            <img 
              src="https://picsum.photos/seed/community/800/1000" 
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              alt="Nexvora Community"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
          </div>
        </div>
      </Card>
      
      <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">Patuhi aturan grup demi kenyamanan bersama</p>
    </div>
  )
}
