
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Wallet, 
  Crown, 
  UserPlus, 
  ShoppingBag, 
  Zap, 
  Users, 
  PlayCircle, 
  TrendingUp, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  ExternalLink,
  Loader2,
  CreditCard,
  ShoppingBasket,
  History,
  GraduationCap,
  Music,
  ArrowUpRight,
  Calendar
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

  // 1. Ambil Data Profil User dari Firestore
  const userProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  // 2. Ambil Statistik Aktivitas
  const ordersQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "traffic_orders"), where("userId", "==", user.uid));
  }, [db, user?.uid]);
  const { data: orders } = useCollection<any>(ordersQuery);

  const topupsQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "topup_requests"), where("userId", "==", user.uid));
  }, [db, user?.uid]);
  const { data: topups } = useCollection<any>(topupsQuery);

  const transactionsQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "coin_transactions"), where("userId", "==", user.uid));
  }, [db, user?.uid]);
  const { data: transactions } = useCollection<any>(transactionsQuery);

  const purchasesQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, "marketplace_purchases"), where("userId", "==", user.uid));
  }, [db, user?.uid]);
  const { data: purchases } = useCollection<any>(purchasesQuery);

  // Resolusi Nama User
  const displayName = profile?.username || user?.displayName || "Pengguna";

  // Gabungkan Aktivitas Terakhir
  const recentActivities = React.useMemo(() => {
    if (!orders && !topups && !purchases) return [];
    
    const combined = [
      ...(orders || []).map(o => ({ ...o, activityType: 'order', label: o.serviceLabel || 'Order Trafik' })),
      ...(topups || []).map(t => ({ ...t, activityType: 'topup', label: 'Top Up Koin' })),
      ...(purchases || []).map(p => ({ ...p, activityType: 'purchase', label: `Beli ${p.productName}` }))
    ];

    return combined
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
        const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [orders, topups, purchases]);

  const totalSpending = React.useMemo(() => {
    if (!transactions) return 0;
    return transactions
      .filter((tx: any) => tx.amount < 0)
      .reduce((acc: number, tx: any) => acc + Math.abs(tx.amount), 0);
  }, [transactions]);

  const copyReferral = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setIsCopied(true);
      toast({ title: "Copied!", description: "Kode referral berhasil disalin." });
      setTimeout(() => setIsCopied(false), 2000);
    }
  }

  const getLevelInfo = (role: string) => {
    const roles = ['user', 'premium', 'private', 'vip', 'mbah paijo'];
    const currentRole = role?.toLowerCase() || 'user';
    const currentIdx = roles.indexOf(currentRole);
    const nextRole = currentIdx < roles.length - 1 ? roles[currentIdx + 1] : null;
    const progress = ((currentIdx + 1) / roles.length) * 100;

    const colors = {
      'user': 'text-slate-400 bg-white/5',
      'premium': 'text-purple-400 bg-purple-400/10',
      'private': 'text-blue-400 bg-blue-400/10',
      'vip': 'text-amber-400 bg-amber-400/10',
      'mbah paijo': 'text-primary bg-primary/10'
    };

    return { 
      current: currentRole.toUpperCase(), 
      next: nextRole?.toUpperCase() || 'MAX LEVEL',
      progress,
      color: colors[currentRole as keyof typeof colors] || colors.user
    };
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Sinkronisasi Panel...</p>
      </div>
    )
  }

  const level = getLevelInfo(profile?.role || 'USER');

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 border-2 border-primary/20 p-1 bg-black/40">
             <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
             <AvatarFallback className="bg-primary/10 text-primary font-bold">
               {displayName.charAt(0).toUpperCase()}
             </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">
              Halo, {displayName}! 👋
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Selamat datang di Nexvora Studio. Kelola seluruh layanan dalam satu dashboard profesional.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
           <Button asChild className="h-12 px-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 font-bold group">
             <Link href="/dashboard/info-admin/kelas">
               <Crown className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Aktivasi VVIP
             </Link>
           </Button>
           <Button asChild className="h-12 px-6 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 hover:bg-green-500/20 font-bold group">
             <Link href="/dashboard/info-admin/forum">
               <Users className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" /> Komunitas
             </Link>
           </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Wallet className="h-3 w-3 text-primary" /> Saldo Koin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-headline font-black text-white">
              {Number(profile?.coins || 0).toLocaleString()}
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase tracking-tighter">
              {profile?.status?.toUpperCase() || 'AKTIF'} ✓
            </Badge>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Crown className="h-3 w-3 text-primary" /> Level Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={cn("text-3xl font-headline font-black uppercase tracking-tight", level.color.split(' ')[0])}>
              {level.current}
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] text-white/40 font-bold">Privilege Unlocked</span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="h-3 w-3 text-primary" /> Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-headline font-black text-white tracking-widest">
              {profile?.referralCode || 'NXV-0000'}
            </div>
            <button onClick={copyReferral} className="flex items-center gap-1.5 text-[10px] text-primary font-black uppercase hover:opacity-80 transition-all">
              {isCopied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {isCopied ? 'Berhasil Salin' : 'Salin Kode Referral'}
            </button>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <ShoppingBag className="h-3 w-3 text-primary" /> Total Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-headline font-black text-white">{orders?.length || 0}</div>
            <span className="text-[10px] text-white/40 font-medium">Sistem Monitoring Aktif</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress Member */}
          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="py-6 px-8 border-b border-white/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Progress Level Member</span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">NEXT: {level.next}</span>
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-4">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-bold text-white/60">Level Saat Ini: <span className="text-primary">{level.current}</span></span>
                   <span className="text-lg font-black text-white">{Math.round(level.progress)}%</span>
                </div>
                <Progress value={level.progress} className="h-3 bg-white/5 rounded-full" />
                <div className="grid grid-cols-5 gap-2 pt-2">
                   {['USER', 'PREMIUM', 'PRIVATE', 'VIP', 'PAIJO'].map((l, i) => (
                     <div key={i} className="flex flex-col items-center gap-2">
                        <div className={cn("h-1.5 w-full rounded-full", i <= ['user', 'premium', 'private', 'vip', 'mbah paijo'].indexOf(level.current.toLowerCase()) ? 'bg-primary' : 'bg-white/5')} />
                        <span className="text-[8px] font-black text-muted-foreground">{l}</span>
                     </div>
                   ))}
                </div>
             </CardContent>
          </Card>

          {/* Aktivitas Terakhir */}
          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
            <CardHeader className="py-6 px-8 border-b border-white/5 flex flex-row items-center justify-between">
               <CardTitle className="text-lg flex items-center gap-3">
                 <History className="h-5 w-5 text-primary" /> Aktivitas Terakhir
               </CardTitle>
               <Link href="/dashboard" className="text-[10px] font-black text-primary uppercase hover:underline">Refresh</Link>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5">
                 {recentActivities.length === 0 ? (
                   <div className="py-20 text-center text-muted-foreground italic text-sm">Belum ada aktivitas terbaru.</div>
                 ) : (
                   recentActivities.map((act: any, i) => (
                     <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                       <div className="flex items-center gap-4">
                         <div className={cn(
                           "h-11 w-11 rounded-xl flex items-center justify-center border",
                           act.activityType === 'order' ? 'bg-primary/10 border-primary/20 text-primary' :
                           act.activityType === 'topup' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                           'bg-blue-500/10 border-blue-500/20 text-blue-500'
                         )}>
                           {act.activityType === 'order' ? <Zap className="h-5 w-5" /> : 
                            act.activityType === 'topup' ? <CreditCard className="h-5 w-5" /> : 
                            <ShoppingBasket className="h-5 w-5" />}
                         </div>
                         <div>
                           <p className="text-sm font-bold text-white">{act.label}</p>
                           <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                             {act.quantity ? `${act.quantity.toLocaleString()} Item` : 
                              act.idrAmount ? `Rp ${act.idrAmount.toLocaleString()}` : 
                              act.amountCoins ? `${act.amountCoins} Koin` : 'Selesai'} • {act.status || 'Berhasil'}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-[10px] text-muted-foreground font-bold uppercase">{act.createdAt?.toDate?.().toLocaleDateString() || '-'}</p>
                         <p className="text-[10px] text-white/40 font-medium">{act.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}</p>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Ringkasan Akun */}
          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Ringkasan Akun
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Total Pesanan</span>
                   </div>
                   <span className="text-sm font-bold text-white">{orders?.length || 0} Order</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Total Top Up</span>
                   </div>
                   <span className="text-sm font-bold text-white">{topups?.length || 0} Kali</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Pengeluaran Koin</span>
                   </div>
                   <span className="text-sm font-bold text-primary">-{totalSpending.toLocaleString()} 🪙</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Member Sejak</span>
                   </div>
                   <span className="text-sm font-bold text-white">
                     {profile?.createdAt?.toDate?.().toLocaleDateString() || '-'}
                   </span>
                </div>
             </CardContent>
          </Card>

          {/* Shortcut Cepat */}
          <Card className="premium-card rounded-3xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" /> Shortcut Cepat
                </CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Trafik Shopee', icon: ShoppingBag, href: '/dashboard/traffic/shopee' },
                  { label: 'Followers', icon: UserPlus, href: '/dashboard/traffic/followers' },
                  { label: 'VT View', icon: PlayCircle, href: '/dashboard/traffic/tiktok-view' },
                  { label: 'Marketplace', icon: ShoppingBasket, href: '/dashboard/marketplace' },
                  { label: 'Materi Gratis', icon: GraduationCap, href: '/dashboard/materials' },
                  { label: 'Komunitas', icon: Users, href: '/dashboard/info-admin/forum' },
                ].map((s, i) => (
                  <Link key={i} href={s.href}>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center text-center gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                       <s.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                       <span className="text-[10px] font-bold text-white/70">{s.label}</span>
                    </div>
                  </Link>
                ))}
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Banner Promosi */}
      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-none relative min-h-[260px] flex items-center shadow-2xl shadow-primary/10">
        <img 
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          alt="Growth"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
        <div className="relative z-10 p-8 md:p-14 space-y-6 max-w-3xl">
          <div className="space-y-3">
            <Badge className="luxury-gradient border-none text-[10px] font-black uppercase px-4 py-1.5 tracking-widest">Growth Engine</Badge>
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-white leading-tight">Tingkatkan Penjualan <br />Shopee & TikTok Anda</h2>
            <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-xl">Gunakan layanan trafik, materi premium, tools, dan komunitas untuk mempercepat pertumbuhan akun bisnis Anda secara profesional.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild className="h-14 px-10 rounded-2xl luxury-gradient font-black text-lg shadow-2xl shadow-primary/30 group">
              <Link href="/dashboard/info-admin/kelas">
                Lihat Kelas <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-14 px-10 rounded-2xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-lg font-bold">
              <Link href="/dashboard/info-admin/forum">Gabung Komunitas</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
