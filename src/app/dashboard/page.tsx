"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  Crown, 
  UserPlus, 
  ShoppingBag, 
  Zap, 
  Users, 
  MessageSquare, 
  PlayCircle, 
  TrendingUp, 
  ShieldCheck, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Globe,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react"
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)

  // User Profile Data
  const userProfileQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  const { data: profile, loading: profileLoading } = useDoc(userProfileQuery);

  // Statistics Data
  const ordersQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "traffic_orders"), where("userId", "==", user.uid));
  }, [db, user?.uid]);
  const { data: orders } = useCollection<any>(ordersQuery);

  const productsQuery = React.useMemo(() => db ? collection(db, "marketplace_products") : null, [db]);
  const { data: products } = useCollection<any>(productsQuery);

  const materialsQuery = React.useMemo(() => db ? collection(db, "materials") : null, [db]);
  const { data: materials } = useCollection<any>(materialsQuery);

  // Recent Activity (Combined)
  const recentOrdersQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "traffic_orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(3));
  }, [db, user?.uid]);
  const { data: recentOrders } = useCollection<any>(recentOrdersQuery);

  const copyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Kode referral berhasil disalin." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  }

  const getLevelColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'vip': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'private': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'premium': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'mbah paijo': return 'text-primary bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]';
      default: return 'text-slate-400 bg-white/5 border-white/10';
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Sinkronisasi Data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20 p-0.5">
               <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
               <AvatarFallback className="bg-primary/10 text-primary font-bold">
                 {profile?.username?.charAt(0).toUpperCase() || 'U'}
               </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">
                Halo, {profile?.username || 'Kreator'}! 👋
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                Selamat datang di Nexvora Studio. Kelola seluruh layanan, trafik, materi, marketplace, dan komunitas dalam satu dashboard profesional.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/info-admin/kelas" className="group">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg shadow-amber-500/5">
               <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                 <Crown className="h-6 w-6" />
               </div>
               <div className="text-left">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Premium Access</p>
                 <p className="text-sm font-bold text-white">Aktivasi VVIP</p>
               </div>
               <ArrowRight className="h-4 w-4 text-amber-500/50 group-hover:translate-x-1 transition-transform ml-2" />
            </div>
          </Link>
          
          <Link href="/dashboard/info-admin/forum" className="group">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all shadow-lg shadow-green-500/5">
               <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                 <Users className="h-6 w-6" />
               </div>
               <div className="text-left">
                 <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Community</p>
                 <p className="text-sm font-bold text-white">Gabung Grup</p>
               </div>
               <ArrowRight className="h-4 w-4 text-green-500/50 group-hover:translate-x-1 transition-transform ml-2" />
            </div>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <Wallet className="h-3 w-3 text-primary" /> Saldo Koin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-headline font-black text-white">{profile?.coins?.toLocaleString() || 0}</div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
               <span className="text-[10px] text-muted-foreground uppercase font-bold">Status Akun</span>
               <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase">
                 {profile?.status?.toUpperCase() || 'AKTIF'}
               </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crown className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <Crown className="h-3 w-3 text-primary" /> Level Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={cn("text-3xl font-headline font-black uppercase tracking-tight", getLevelColor(profile?.role || 'USER').split(' ')[0])}>
              {profile?.role || 'USER'}
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
               <span className="text-[10px] text-muted-foreground uppercase font-bold">Privilege</span>
               <span className="text-[9px] text-white/50 font-medium italic">Fitur Terbuka ✓</span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <UserPlus className="h-3 w-3 text-primary" /> Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-headline font-black text-white tracking-widest">
              {profile?.referralCode || 'NXV-0000'}
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
               <button 
                onClick={copyReferral}
                className="flex items-center gap-1.5 text-[10px] text-primary font-black uppercase hover:opacity-80 transition-opacity"
               >
                 {isCopied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                 {isCopied ? 'Berhasil Salin' : 'Klik Salin Kode'}
               </button>
               <span className="text-[9px] text-muted-foreground font-bold">Bonus 10% 🪙</span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <ShoppingBag className="h-3 w-3 text-primary" /> Total Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-headline font-black text-white">{orders?.length || 0}</div>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
               <span className="text-[10px] text-muted-foreground uppercase font-bold">Last Activity</span>
               <span className="text-[10px] text-white font-medium">Realtime Monitor</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Banner Section */}
      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-none relative min-h-[220px] flex items-center shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Academy"
          data-ai-hint="dark abstract"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="relative z-10 p-8 md:p-12 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Badge className="luxury-gradient border-none text-[10px] font-black uppercase px-4 py-1">New Academy</Badge>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-white leading-tight">Nexvora Academy</h2>
            <p className="text-muted-foreground text-sm md:text-lg">Tingkatkan skill Shopee, TikTok, Live Streaming, dan Digital Marketing bersama mentor profesional.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild className="h-12 px-8 rounded-xl luxury-gradient font-bold shadow-xl shadow-primary/20">
              <Link href="/dashboard/info-admin/kelas">Lihat Detail Kelas</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10">
              <Link href="/dashboard/info-admin/forum">Gabung Komunitas</Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Detailed Services & Activity */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Services & History */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 py-6">
              <CardTitle className="text-xl flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" /> Trafik Services Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-white/5">
                 {[
                   { label: 'Shopee Trafik', key: 'shopee_view' },
                   { label: 'Shopee Follow', key: 'shopee_follow' },
                   { label: 'Shopee Like', key: 'shopee_like' },
                   { label: 'TikTok View', key: 'tiktok_view' },
                   { label: 'TikTok Saved', key: 'tiktok_saved' },
                 ].map((svc, i) => (
                   <div key={i} className="p-6 flex flex-col items-center text-center gap-2 hover:bg-white/[0.02] transition-colors">
                     <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">{svc.label}</span>
                     <span className="text-2xl font-headline font-black text-white">
                        {orders?.filter((o: any) => o.platform?.toLowerCase() === (svc.key.includes('shopee') ? 'shopee' : 'tiktok')).length || 0}
                     </span>
                     <Badge variant="outline" className="text-[8px] border-primary/20 text-primary font-black py-0 h-4">ONLINE</Badge>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
            <CardHeader className="py-6">
               <CardTitle className="text-xl flex items-center gap-3">
                 <Clock className="h-5 w-5 text-primary" /> Aktivitas Terbaru
               </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
               <div className="space-y-4">
                 {!recentOrders || recentOrders.length === 0 ? (
                   <div className="py-10 text-center text-muted-foreground italic text-sm">Belum ada aktivitas baru.</div>
                 ) : (
                   recentOrders.map((order: any) => (
                     <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <Zap className="h-5 w-5" />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-white">{order.serviceLabel || order.platform?.toUpperCase()}</p>
                           <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{order.quantity?.toLocaleString()} Views • {order.status}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-xs font-mono text-muted-foreground">{new Date(order.createdAt?.toDate()).toLocaleDateString()}</p>
                         <p className="text-[9px] text-primary font-black">-{order.coinCost} 🪙</p>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mini Cards */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Marketplace Digital
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <span className="text-xs text-muted-foreground">Produk Tersedia</span>
                   <span className="text-lg font-bold text-white">{products?.length || 0} Item</span>
                </div>
                <Button asChild className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold">
                  <Link href="/dashboard/marketplace">Jelajahi Katalog <ExternalLink className="ml-2 h-4 w-4" /></Link>
                </Button>
             </CardContent>
          </Card>

          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-primary" /> Materi Gratis
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <span className="text-xs text-muted-foreground">Materi Belajar</span>
                   <span className="text-lg font-bold text-white">{materials?.length || 0} Video</span>
                </div>
                <Button asChild className="w-full h-11 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-bold">
                  <Link href="/dashboard/materials">Mulai Belajar <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
             </CardContent>
          </Card>

          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 text-green-500">
                  <ShieldCheck className="h-4 w-4" /> Status Sistem
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                {[
                  { name: 'Database Cloud', icon: Database },
                  { name: 'API Services', icon: Globe },
                  { name: 'Marketplace', icon: ShoppingBag },
                  { name: 'Nexvora Academy', icon: PlayCircle },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-1">
                    <div className="flex items-center gap-3">
                      <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-white/70">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                       <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Normal</span>
                    </div>
                  </div>
                ))}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
