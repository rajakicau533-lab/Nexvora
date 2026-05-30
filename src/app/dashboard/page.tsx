"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CreditCard, UserCheck, MessageSquare, PlayCircle, ExternalLink, Sparkles, ShieldCheck, Zap } from "lucide-react"
import { CONTACT_INFO } from "@/lib/constants"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()

  const userProfileQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userProfileQuery);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h2 className="text-4xl font-headline font-bold text-white">Halo, {profile?.username || 'Kreator'}! 👋</h2>
          <p className="text-muted-foreground text-lg">Pusat kendali Nexvora Anda. Akses semua layanan dalam satu klik.</p>
        </div>
        <div className="flex gap-4">
          <Button className="luxury-gradient border-none font-black rounded-xl h-12 px-6 shadow-xl shadow-primary/20">
            <UserCheck className="mr-2 h-5 w-5" /> Aktivasi VVIP
          </Button>
          <Button variant="outline" asChild className="border-white/10 bg-black/40 hover:bg-white/5 rounded-xl h-12 px-6 text-muted-foreground hover:text-white transition-all">
            <a href={CONTACT_INFO.whatsapp_group} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" /> Grup Komunitas
            </a>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="premium-card rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Total Koin Anda</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-5xl font-headline font-black text-white">{profile?.coins?.toLocaleString() || 0}</div>
            <div className="flex items-center gap-2 mt-4">
              <Badge className="bg-green-500/20 text-green-500 border-none px-3 font-bold">STATUS: {profile?.status?.toUpperCase() || 'AKTIF'}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card rounded-[2rem] bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Level Akun</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <Zap className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-4xl font-headline font-black text-primary uppercase">{profile?.role || 'USER'}</div>
            <p className="text-sm text-muted-foreground mt-4 font-medium italic">Akses dashboard profesional terbuka.</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-[2rem] bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Kode Unik Referral</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-headline font-black text-white tracking-[0.1em]">{profile?.referralCode || 'NXV-0000'}</div>
            <p className="text-sm text-muted-foreground mt-4">Bonus 10% koin dari teman yang mendaftar.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <PlayCircle className="text-primary h-7 w-7" /> Roadmap Nexvora Studio
            </CardTitle>
            <CardDescription className="text-muted-foreground">Langkah awal untuk memaksimalkan hasil bisnis Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {[
              { step: "1", title: "Isi Koin Melalui Top Up", desc: "Klik menu Top Up untuk mengisi saldo koin via transfer manual." },
              { step: "2", title: "Boost Trafik Sosial Media", desc: "Masukkan URL Shopee atau TikTok untuk menaikkan engagement." },
              { step: "3", title: "Gunakan Layanan Creator AI", desc: "Buat gambar & video premium untuk konten promosi Anda." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center font-black text-primary border border-white/5 group-hover:bg-primary group-hover:text-white transition-all text-xl shadow-lg">
                  {item.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-lg">{item.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="flex items-center gap-3 text-2xl text-white">
              <ShieldCheck className="text-green-500 h-7 w-7" /> Keamanan & Verifikasi
            </CardTitle>
            <CardDescription className="text-muted-foreground">Data akun Anda terenkripsi oleh sistem Nexvora Secure.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center text-center space-y-6 shadow-inner">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline font-bold text-xl">Email Terdaftar</h4>
                  <p className="text-lg text-white font-mono">{user?.email}</p>
                </div>
                <Badge variant={user?.emailVerified ? "default" : "destructive"} className={cn("px-6 py-1.5 rounded-full text-xs font-black", user?.emailVerified ? "bg-green-500 text-white" : "luxury-gradient")}>
                  {user?.emailVerified ? "TERVERIFIKASI ✓" : "BUTUH VERIFIKASI"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}