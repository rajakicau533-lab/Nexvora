
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, CreditCard, UserCheck, MessageSquare, PlayCircle, ExternalLink, Sparkles } from "lucide-react"
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold">Halo, {profile?.username || 'User'}! 👋</h2>
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

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="premium-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Koin</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold text-primary">{profile?.coins?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Status: <Badge variant="outline" className={`text-[10px] ${profile?.status === 'active' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>{profile?.status?.toUpperCase() || 'LOADING'}</Badge></p>
          </CardContent>
        </Card>
        
        <Card className="premium-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Akun Role</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-headline font-bold uppercase">{profile?.role || '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">Tingkat akses sistem Anda</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Referral Code</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-headline font-bold text-secondary uppercase tracking-widest">{profile?.referralCode || 'GEN-000'}</div>
            <p className="text-xs text-muted-foreground mt-1">Gunakan kode ini untuk bonus 10%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
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
                <p className="text-sm text-muted-foreground">Lakukan pengisian koin melalui menu Top Up untuk akses ke seluruh layanan.</p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-primary border border-primary/20">2</div>
              <div>
                <h4 className="font-bold text-foreground">Gunakan Trafik Service</h4>
                <p className="text-sm text-muted-foreground">Input URL Shopee atau TikTok Anda di menu Trafik Service.</p>
              </div>
            </div>
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-primary border border-primary/20">3</div>
              <div>
                <h4 className="font-bold text-foreground">Explorasi Creator AI</h4>
                <p className="text-sm text-muted-foreground">Gunakan koin Anda untuk membuat konten visual premium.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary" /> Keamanan Akun
            </CardTitle>
            <CardDescription>Pastikan akun Anda tetap aman dan terverifikasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center space-y-4">
                <Sparkles className="h-10 w-10 text-primary" />
                <h4 className="font-bold">Verifikasi Email Anda</h4>
                <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
                <Badge variant={user?.emailVerified ? "default" : "destructive"}>
                  {user?.emailVerified ? "TERVERIFIKASI" : "BELUM VERIFIKASI"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
