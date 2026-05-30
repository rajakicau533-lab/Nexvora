"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CreditCard, UserCheck, MessageSquare, PlayCircle, ExternalLink, Sparkles } from "lucide-react"
import { CONTACT_INFO } from "@/lib/constants"

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold">Halo, User Premium! 👋</h2>
          <p className="text-muted-foreground">Selamat datang kembali di pusat kendali digital Anda.</p>
        </div>
        <div className="flex gap-3">
          <Button className="luxury-gradient border-none font-bold rounded-xl shadow-lg shadow-primary/20">
            <UserCheck className="mr-2 h-4 w-4" /> Aktivasi Akun
          </Button>
          <Button variant="outline" asChild className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl">
            <a href={CONTACT_INFO.whatsapp_group} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-2 h-4 w-4" /> Grup WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="premium-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Koin</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold text-primary">1,250</div>
            <p className="text-xs text-muted-foreground mt-1">Status: <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">Aktif</Badge></p>
          </CardContent>
        </Card>
        
        <Card className="premium-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Trafik Aktif</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Pesanan sedang diproses</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Reward Referral</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold text-secondary">25</div>
            <p className="text-xs text-muted-foreground mt-1">Koin didapat dari referral</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Usage Guide */}
        <Card className="premium-card rounded-3xl border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="text-primary" /> Cara Menggunakan Nexvora Studio
            </CardTitle>
            <CardDescription>Panduan singkat untuk memaksimalkan fitur platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-primary border border-primary/20">1</div>
              <div>
                <h4 className="font-bold text-foreground">Top Up Koin</h4>
                <p className="text-sm text-muted-foreground">Lakukan pengisian koin melalui menu Top Up. 1 Koin seharga Rp3.000 untuk akses ke seluruh layanan.</p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-primary border border-primary/20">2</div>
              <div>
                <h4 className="font-bold text-foreground">Gunakan Trafik Service</h4>
                <p className="text-sm text-muted-foreground">Input URL Shopee atau TikTok Anda di menu Trafik Service untuk meningkatkan views secara instan.</p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-primary border border-primary/20">3</div>
              <div>
                <h4 className="font-bold text-foreground">Explorasi Creator AI</h4>
                <p className="text-sm text-muted-foreground">Gunakan koin Anda untuk membuat konten visual premium menggunakan teknologi AI tercanggih kami.</p>
              </div>
            </div>
            <Button variant="link" className="text-primary p-0 h-auto font-bold flex items-center gap-1 group">
              Lihat Tutorial Lengkap <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Coin History */}
        <Card className="premium-card rounded-3xl border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary" /> Riwayat Koin Terakhir
            </CardTitle>
            <CardDescription>Aktivitas transaksi koin di akun Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Top Up Berhasil", date: "2 jam lalu", amount: "+50", type: "in" },
                { label: "Order Shopee Service", date: "5 jam lalu", amount: "-10", type: "out" },
                { label: "Hadiah Referral", date: "1 hari lalu", amount: "+2", type: "in" },
                { label: "Pembelian Digital Art AI", date: "2 hari lalu", amount: "-5", type: "out" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {item.type === 'in' ? <Sparkles className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.date}</p>
                    </div>
                  </div>
                  <span className={`font-headline font-bold ${item.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                    {item.amount} 🪙
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
