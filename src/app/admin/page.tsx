
"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Users, 
  Activity, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ShoppingBag, 
  BookOpen, 
  Coins, 
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  Wallet
} from "lucide-react"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, limit, orderBy, where, Timestamp, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { checkProviderBalance } from "@/ai/flows/process-traffic-order-flow"

export default function AdminDashboardPage() {
  const db = useFirestore()
  const [providerBalance, setProviderBalance] = useState<string | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)

  // API Config for Balance Check
  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  // Data Fetching
  const { data: allUsers, loading: usersLoading } = useCollection<any>(db ? collection(db, "users") : null)
  const { data: allOrders, loading: ordersLoading } = useCollection<any>(db ? collection(db, "traffic_orders") : null)
  const { data: allTopups, loading: topupsLoading } = useCollection<any>(db ? collection(db, "topup_requests") : null)
  const { data: marketplacePurchases } = useCollection<any>(db ? collection(db, "marketplace_purchases") : null)
  const { data: allMaterials } = useCollection<any>(db ? collection(db, "materials") : null)

  const fetchBalance = async () => {
    if (!apiSettings?.apiUrl || !apiSettings?.apiKey || isCheckingBalance) return
    setIsCheckingBalance(true)
    try {
      const res = await checkProviderBalance({
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey
      })
      if (res.success) setProviderBalance(res.balance || "0")
    } catch (e) {
      console.error("Balance fetch error", e)
    } finally {
      setIsCheckingBalance(false)
    }
  }

  useEffect(() => {
    if (apiSettings) fetchBalance()
  }, [!!apiSettings])

  // 1. Process Stats
  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Timestamp(Math.floor(new Date(now.setHours(0,0,0,0)).getTime() / 1000), 0)

    const todayUsers = allUsers?.filter(u => u.createdAt?.seconds >= startOfToday.seconds).length || 0
    const activeOrders = allOrders?.filter(o => ["pending", "processing", "PROCESSING", "PENDING", "Pending", "Processing"].includes(o.status)).length || 0
    const pendingTopups = allTopups?.filter(t => t.status === 'pending').length || 0
    const totalRevenue = allOrders?.reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    const todayRevenue = allOrders?.filter(o => o.createdAt?.seconds >= startOfToday.seconds).reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    const todayOrders = allOrders?.filter(o => o.createdAt?.seconds >= startOfToday.seconds).length || 0
    const todayTopupCount = allTopups?.filter(t => t.createdAt?.seconds >= startOfToday.seconds).length || 0
    
    return {
      totalUsers: allUsers?.length || 0,
      todayUsers,
      activeOrders,
      pendingTopups,
      totalRevenue,
      todayRevenue,
      todayOrders,
      todayTopupCount,
      marketplaceSales: marketplacePurchases?.length || 0,
      materiCount: allMaterials?.length || 0
    }
  }, [allUsers, allOrders, allTopups, marketplacePurchases, allMaterials])

  // 2. Chart Data (Last 7 Days)
  const chartData = useMemo(() => {
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        name: days[d.getDay()],
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        orders: 0,
        revenue: 0,
        rawDate: new Date(d.setHours(0,0,0,0)).getTime()
      }
    })

    allOrders?.forEach(o => {
      const orderDate = o.createdAt?.toDate?.() ? new Date(o.createdAt.toDate().setHours(0,0,0,0)).getTime() : 0
      const dayIndex = last7Days.findIndex(d => d.rawDate === orderDate)
      if (dayIndex !== -1) {
        last7Days[dayIndex].orders += 1
        last7Days[dayIndex].revenue += (o.coinCost || 0)
      }
    })

    return last7Days
  }, [allOrders])

  // 3. Pending Actions
  const pendingActions = useMemo(() => {
    const actions = []
    if (stats.pendingTopups > 0) actions.push({ label: `${stats.pendingTopups} Topup Menunggu Konfirmasi`, type: 'topup', color: 'text-amber-500', href: '/admin/users' })
    const failedOrders = allOrders?.filter(o => ["failed", "GAGAL", "CANCELLED", "CANCEL", "FAILED"].includes(o.status)).slice(0, 3)
    failedOrders?.forEach(o => actions.push({ label: `Order Gagal: ${o.id?.slice(0,8)}`, type: 'order', color: 'text-red-500', href: '/admin/traffic' }))
    
    // Add provider balance warning
    if (providerBalance && parseInt(providerBalance.replace(/[^0-9]/g, '')) < 50000) {
      actions.push({ label: `Saldo SMM.ID Menipis: Rp ${providerBalance}`, type: 'warning', color: 'text-red-600', href: '/admin/settings' })
    }

    return actions
  }, [stats.pendingTopups, allOrders, providerBalance])

  // 4. Recent Activity
  const recentActivities = useMemo(() => {
    const combined = [
      ...(allUsers || []).map(u => ({ ...u, actType: 'REGISTRASI', desc: `${u.email} mendaftar`, color: 'text-blue-500' })),
      ...(allOrders || []).map(o => ({ ...o, actType: 'ORDER', desc: `Pesanan ${o.serviceLabel || o.platform} - ${o.coinCost} 🪙`, color: 'text-primary' })),
      ...(allTopups || []).map(t => ({ ...t, actType: 'TOPUP', desc: `Topup ${t.amountCoins} Koin - ${t.status}`, color: 'text-green-500' }))
    ]
    return combined
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 10)
  }, [allUsers, allOrders, allTopups])

  if (usersLoading || ordersLoading || topupsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Initialize Admin Terminal...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">Nexvora Executive Dashboard</h2>
          <p className="text-muted-foreground text-sm">Pemantauan ekosistem digital Nexvora secara terpusat.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <Badge variant="outline" className="w-fit border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] px-4 py-1.5 tracking-widest">
            SYSTEM STABLE ✓
          </Badge>
          {apiSettings && (
             <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-1.5 rounded-full">
                <Wallet className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black text-white/60 uppercase">SMM.ID: </span>
                <span className={cn("text-xs font-bold", parseInt(providerBalance || "0") < 20000 ? "text-red-500 animate-pulse" : "text-primary")}>
                  {isCheckingBalance ? "..." : `Rp ${providerBalance || "Checking..."}`}
                </span>
                <button onClick={fetchBalance} disabled={isCheckingBalance} className="hover:text-primary transition-colors">
                  <RefreshCw className={cn("h-3 w-3", isCheckingBalance && "animate-spin")} />
                </button>
             </div>
          )}
        </div>
      </div>

      {/* 1. Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total User", value: stats.totalUsers, sub: `+${stats.todayUsers} hari ini`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Order Aktif", value: stats.activeOrders, sub: "Menunggu proses", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Topup Pending", value: stats.pendingTopups, sub: "Verifikasi segera", icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
          { label: "Revenue", value: `${stats.totalRevenue.toLocaleString()}`, sub: `+${stats.todayRevenue} hari ini`, icon: Coins, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Marketplace", value: stats.marketplaceSales, sub: "Total penjualan", icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Materi", value: stats.materiCount, sub: "Pelajaran aktif", icon: BookOpen, color: "text-cyan-500", bg: "bg-cyan-500/10" },
        ].map((s, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden group hover:border-primary/30 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{s.label}</p>
               <div className={cn("p-1.5 rounded-lg", s.bg)}>
                 <s.icon className={cn("h-3.5 w-3.5", s.color)} />
               </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-headline font-black text-white">{s.value}</div>
              <p className="text-[9px] text-white/40 mt-1 font-bold uppercase">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Middle Section: Summary & Charts */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Today Summary */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <TrendingUp className="h-4 w-4 text-primary" /> Ringkasan Hari Ini
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">User Baru</p>
                     <p className="text-2xl font-headline font-bold text-white">{stats.todayUsers}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Order Baru</p>
                     <p className="text-2xl font-headline font-bold text-white">{stats.todayOrders}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Revenue</p>
                     <p className="text-2xl font-headline font-bold text-primary">{stats.todayRevenue} 🪙</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                     <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Topup</p>
                     <p className="text-2xl font-headline font-bold text-white">{stats.todayTopupCount}</p>
                  </div>
                </div>
             </CardContent>
          </Card>

          {/* Quick Access */}
          <div className="space-y-4">
             <h3 className="text-sm font-black uppercase text-white/40 tracking-[0.2em] ml-2">Quick Access</h3>
             <div className="grid grid-cols-3 gap-3">
               {[
                 { label: "Users", icon: Users, href: "/admin/users" },
                 { label: "Traffic", icon: Activity, href: "/admin/traffic" },
                 { label: "Market", icon: ShoppingBag, href: "/admin/marketplace" },
                 { label: "Lessons", icon: BookOpen, href: "/admin/materials" },
                 { label: "Logs", icon: Clock, href: "/admin/traffic/logs" },
                 { label: "Settings", icon: ShieldCheck, href: "/admin/settings" },
               ].map((q, i) => (
                 <Link key={i} href={q.href}>
                   <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group">
                      <q.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[9px] font-black text-white/60 uppercase">{q.label}</span>
                   </div>
                 </Link>
               ))}
             </div>
          </div>
        </div>

        {/* 7 Days Trend Chart */}
        <Card className="lg:col-span-8 premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="text-lg text-white">Trend Performa (7 Hari Terakhir)</CardTitle>
              <CardDescription>Volume pesanan dan pendapatan harian.</CardDescription>
            </div>
            <div className="flex gap-2">
               <Badge variant="outline" className="border-primary/20 text-primary text-[9px] uppercase font-black">Revenue</Badge>
               <Badge variant="outline" className="border-white/10 text-white/40 text-[9px] uppercase font-black">Orders</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff40" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid #ffffff10', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#ffffff40" 
                    strokeWidth={2}
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Bottom Section: Actions & Activity */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Pending Actions */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-sm font-black uppercase text-white tracking-[0.2em] ml-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" /> Membutuhkan Tindakan
          </h3>
          <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
            <CardContent className="p-0">
               {pendingActions.length === 0 ? (
                 <div className="p-12 text-center text-muted-foreground text-sm italic">Tidak ada tindakan yang memerlukan perhatian.</div>
               ) : (
                 <div className="divide-y divide-white/5">
                    {pendingActions.map((action, i) => (
                      <Link key={i} href={action.href} className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors group">
                        <div className="flex items-center gap-4">
                           <div className={cn("p-2.5 rounded-xl bg-white/5", action.color)}>
                              {action.type === 'topup' ? <CreditCard className="h-5 w-5" /> : 
                               action.type === 'warning' ? <AlertCircle className="h-5 w-5" /> :
                               <Zap className="h-5 w-5" />}
                           </div>
                           <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{action.label}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-all" />
                      </Link>
                    ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Log */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-sm font-black uppercase text-white tracking-[0.2em] ml-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Log Aktivitas Terbaru
          </h3>
          <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground">Waktu</th>
                      <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground">Event</th>
                      <th className="px-6 py-4 font-black uppercase tracking-wider text-muted-foreground">Keterangan</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentActivities.map((act, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-white/40 whitespace-nowrap">
                          {act.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn("text-[9px] font-black uppercase border-none", act.color, "bg-current opacity-10")}>
                             {act.actType}
                          </Badge>
                          <span className={cn("ml-2 font-black uppercase text-[9px]", act.color)}>{act.actType}</span>
                        </td>
                        <td className="px-6 py-4 text-white font-medium max-w-[200px] truncate">{act.desc}</td>
                        <td className="px-6 py-4 text-right">
                           <ChevronRight className="h-3 w-3 text-white/20 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
