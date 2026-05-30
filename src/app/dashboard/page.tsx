"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CreditCard, UserCheck, MessageSquare, PlayCircle, ExternalLink, Sparkles, ShieldCheck, Zap } from "lucide-react"
import { CONTACT_INFO } from "@/lib/constants"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()

  const userProfileQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userProfileQuery);

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-white">Halo, {profile?.username || 'Kreator'}! 👋</h2>
          <p className="text-muted-foreground text-base">Kelola seluruh layanan Nexvora Anda dalam satu tempat.</p>
        </div>
        <div className="flex gap-3">
          <Button className="luxury-gradient border-none font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/20 text-sm">
            <UserCheck className="mr-2 h-4 w-4" /> Aktivasi VVIP
          </Button>
          <Button variant="outline" asChild className="border-white/10 bg-black/40 hover:bg-white/5 rounded-xl h-11 px-6 text-muted-foreground hover:text-white transition-all text-sm">
            <a href={CONTACT_INFO.whatsapp_group} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-2 h-4 w-4 text-primary" /> Komunitas
            </a>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="premium-card rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Saldo Koin</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-4xl font-headline font-black text-white">{profile?.coins?.toLocaleString() || 0}</div>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-green-500/20 text-green-500 border-none px-2.5 py-0.5 text-[10px] font-bold">STATUS: {profile?.status?.toUpperCase() || 'AKTIF'}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card rounded-2xl bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Level Akun</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-headline font-black text-primary uppercase">{profile?.role || 'USER'}</div>
            <p className="text-xs text-muted-foreground mt-3 font-medium italic">Fitur profesional terbuka.</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-2xl bg-black/40 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Kode Referral</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-headline font-black text-white tracking-[0.1em]">{profile?.referralCode || 'NXV-0000'}</div>
            <p className="text-xs text-muted-foreground mt-3">Komisi 10% koin per pengisian.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <Card className="premium-card rounded-3xl border-white/5 bg-black/40 lg:col-span-7">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-3 text-xl">
              <PlayCircle className="text-primary h-5 w-5" /> Roadmap Nexvora
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">Langkah awal memaksimalkan pertumbuhan digital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {[
              { step: "1", title: "Top Up Koin", desc: "Isi saldo koin via transfer manual untuk akses layanan." },
              { step: "2", title: "Boost Trafik", desc: "Masukkan URL konten untuk menaikkan engagement instan." },
              { step: "3", title: "Creator AI", desc: "Buat aset gambar & video premium menggunakan AI." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 group items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center font-black text-primary border border-white/5 group-hover:bg-primary group-hover:text-white transition-all text-base">
                  {item.step}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">{item.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl border-white/5 bg-black/40 overflow-hidden lg:col-span-5">
          <CardHeader className="px-6 pt-6 text-center">
            <CardTitle className="text-lg text-white">Nexvora Secure ✓</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Status keamanan akun terenkripsi.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white/50 uppercase tracking-widest">Email Terdaftar</h4>
                <p className="text-base text-white font-mono truncate max-w-full px-2">{user?.email}</p>
              </div>
              <Badge variant={user?.emailVerified ? "default" : "destructive"} className={cn("px-4 py-1 rounded-full text-[10px] font-black", user?.emailVerified ? "bg-green-500 text-white" : "luxury-gradient")}>
                {user?.emailVerified ? "VERIFIED ✓" : "UNVERIFIED"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}