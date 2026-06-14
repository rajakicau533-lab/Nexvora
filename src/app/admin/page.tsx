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
  Wallet,
  MailCheck,
  MailQuestion,
  UserCheck,
  UserRoundCheck,
  UserRoundX
} from "lucide-react"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, limit, orderBy, where, Timestamp, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { checkProviderBalance } from "@/ai/flows/process-traffic-order-flow"
import { calculateTotalUserCoins } from "@/lib/admin-stats-service"

export default function AdminDashboardPage() {
  const db = useFirestore()
  const [providerBalance, setProviderBalance] = useState<string | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)

  // Stable API Config
  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  // Optimized Parallel Queries - FETCH ALL
  const usersQuery = React.useMemo(() => (db ? collection(db, "users") : null), [db])
  const { data: allUsers, loading: usersLoading } = useCollection<any>(usersQuery)
  
  const ordersQuery = React.useMemo(() => (db ? collection(db, "traffic_orders") : null), [db])
  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery)

  const topupsQuery = React.useMemo(() => (db ? collection(db, "topup_requests") : null), [db])
  const { data: allTopups, loading: topupsLoading } = useCollection<any>(topupsQuery)

  const marketplaceQuery = React.useMemo(() => (db ? collection(db, "marketplace_purchases") : null), [db])
  const { data: marketplacePurchases, loading: marketLoading } = useCollection<any>(marketplaceQuery)

  const materialsQuery = React.useMemo(() => (db ? collection(db, "materials") : null), [db])
  const { data: allMaterials, loading: materialsLoading } = useCollection<any>(materialsQuery)

  // Query for Activity Logs to detect User Online
  const recentLogsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(100))
  }, [db])
  const { data: recentLogs, loading: logsLoading } = useCollection<any>(recentLogsQuery)

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

  // Aggregate Stats
  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Timestamp(Math.floor(new Date(now.setHours(0,0,0,0)).getTime() / 1000), 0)
    
    // Online Users Calculation (last 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)

    const todayUsers = allUsers?.filter(u => (u.createdAt?.seconds || 0) >= startOfToday.seconds).length || 0
    const activeOrders = allOrders?.filter(o => ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status)).length || 0
    const pendingTopups = allTopups?.filter(t => t.status === 'pending').length || 0
    const totalRevenue = allOrders?.reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    const todayRevenue = allOrders?.filter(o => (o.createdAt?.seconds || 0) >= startOfToday.seconds).reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    const totalUserCoins = calculateTotalUserCoins(allUsers)
    
    // Status Stats
    const verifiedUsers = allUsers?.filter(u => u.emailVerified === true).length || 0
    const unverifiedUsers = (allUsers?.length || 0) - verifiedUsers
    
    // Admin Verification Stats
    const adminVerified = allUsers?.filter(u => u.adminVerified === true).length || 0
    const adminNotVerified = (allUsers?.length || 0) - adminVerified

    // Online count
    const activeUserIds = new Set(
      recentLogs?.filter(l => {
        const ts = l.timestamp?.toDate?.() || new Date(0);
        return ts > fiveMinsAgo;
      }).map(l => l.userId)
    )
    const onlineUsersCount = activeUserIds.size

    return {
      totalUsers: allUsers?.length || 0,
      totalUserCoins,
      todayUsers,
      activeOrders,
      pendingTopups,
      totalRevenue,
      todayRevenue,
      marketplaceSales: marketplacePurchases?.length || 0,
      materiCount: allMaterials?.length || 0,
      verifiedUsers,
      unverifiedUsers,
      onlineUsersCount,
      adminVerified,
      adminNotVerified
    }
  }, [allUsers, allOrders, allTopups, marketplacePurchases, allMaterials, recentLogs])

  const isLoadingStats = usersLoading || ordersLoading || topupsLoading

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">Nexvora Dashboard</h2>
          <p className="text-muted-foreground text-sm">Monitoring sistem cerdas & realtime.</p>
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
                  {isCheckingBalance ? "..." : providerBalance ? `Rp ${providerBalance}` : "Checking..."}
                </span>
                <button onClick={fetchBalance} disabled={isCheckingBalance} className="hover:text-primary transition-colors">
                  <RefreshCw className={cn("h-3 w-3", isCheckingBalance && "animate-spin")} />
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Row 1: Core User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total User", value: stats.totalUsers.toLocaleString(), sub: `+${stats.todayUsers} hari ini`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", loading: usersLoading },
          { label: "User Online", value: stats.onlineUsersCount, sub: "ONLINE NOW (5 MIN)", icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10", loading: logsLoading },
          { label: "Total Koin User", value: stats.totalUserCoins.toLocaleString(), sub: "KOIN BEREDAR", icon: Wallet, color: "text-primary", bg: "bg-primary/10", loading: usersLoading },
          { label: "Admin Verified", value: stats.adminVerified.toLocaleString(), sub: "AKUN AKTIF", icon: UserRoundCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", loading: usersLoading },
          { label: "Admin Pending", value: stats.adminNotVerified.toLocaleString(), sub: "BUTUH AKTIVASI", icon: UserRoundX, color: "text-amber-500", bg: "bg-amber-500/10", loading: usersLoading },
        ].map((s, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden group hover:border-primary/30 transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{s.label}</p>
               <div className={cn("p-1.5 rounded-lg", s.bg)}>
                 <s.icon className={cn("h-3.5 w-3.5", s.color)} />
               </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {s.loading ? (
                <Skeleton className="h-8 w-20 bg-white/5 rounded-lg" />
              ) : (
                <div className="text-xl md:text-2xl font-headline font-black text-white truncate">{s.value}</div>
              )}
              <p className="text-[9px] text-white/40 mt-1 font-bold uppercase">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2: Secondary Operational Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Email Verified", value: stats.verifiedUsers.toLocaleString(), sub: "VERIFIED", icon: MailCheck, color: "text-cyan-500", bg: "bg-cyan-500/10", loading: usersLoading },
          { label: "Email Pending", value: stats.unverifiedUsers.toLocaleString(), sub: "NOT VERIFIED", icon: MailQuestion, color: "text-slate-400", bg: "bg-white/5", loading: usersLoading },
          { label: "Revenue", value: `${stats.totalRevenue.toLocaleString()}`, sub: `+${stats.todayRevenue} hari ini`, icon: Coins, color: "text-green-500", bg: "bg-green-500/10", loading: ordersLoading },
          { label: "Order Aktif", value: stats.activeOrders, sub: "Antrean SMM", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10", loading: ordersLoading },
          { label: "Marketplace", value: stats.marketplaceSales, sub: "Produk Terjual", icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10", loading: marketLoading },
        ].map((s, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden group hover:border-primary/30 transition-all opacity-80">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{s.label}</p>
               <div className={cn("p-1.5 rounded-lg", s.bg)}>
                 <s.icon className={cn("h-3.5 w-3.5", s.color)} />
               </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {s.loading ? (
                <Skeleton className="h-8 w-20 bg-white/5 rounded-lg" />
              ) : (
                <div className="text-xl md:text-2xl font-headline font-black text-white truncate">{s.value}</div>
              )}
              <p className="text-[9px] text-white/40 mt-1 font-bold uppercase">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <TrendingUp className="h-4 w-4 text-primary" /> Ringkasan Hari Ini
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "User Baru", val: stats.todayUsers, loading: usersLoading },
                    { label: "Revenue", val: `${stats.todayRevenue} 🪙`, loading: ordersLoading, highlight: true },
                    { label: "Materi Aktif", val: stats.materiCount, loading: materialsLoading },
                    { label: "Sales Market", val: stats.marketplaceSales, loading: marketLoading },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">{item.label}</p>
                      {item.loading ? (
                        <Skeleton className="h-7 w-12 bg-white/5" />
                      ) : (
                        <p className={cn("text-2xl font-headline font-bold text-white", item.highlight && "text-primary")}>{item.val}</p>
                      )}
                    </div>
                  ))}
                </div>
             </CardContent>
          </Card>

          <div className="space-y-4">
             <h3 className="text-sm font-black uppercase text-white/40 tracking-[0.2em] ml-2">Quick Access</h3>
             <div className="grid grid-cols-3 gap-3">
               {[
                 { label: "Users", icon: Users, href: "/admin/users" },
                 { label: "Traffic", icon: Activity, href: "/admin/traffic" },
                 { label: "Market", icon: ShoppingBag, href: "/admin/marketplace" },
                 { label: "Lessons", icon: BookOpen, href: "/admin/materials" },
                 { label: "Topups", icon: Wallet, href: "/admin/topup-monitor" },
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

        <Card className="lg:col-span-8 premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="text-lg text-white">Trend Aktivitas</CardTitle>
              <CardDescription>Visualisasi pertumbuhan dan revenue.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full flex items-center justify-center bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Performance Analytics Feed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
