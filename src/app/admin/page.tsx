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
  UserRoundX,
  Crown
} from "lucide-react"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, limit, orderBy, where, Timestamp, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { checkProviderBalance } from "@/ai/flows/process-traffic-order-flow"
import { calculateTotalUserCoins } from "@/lib/admin-stats-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
    return query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(50))
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
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)

    const todayUsers = allUsers?.filter(u => (u.createdAt?.seconds || 0) >= startOfToday.seconds).length || 0
    const activeOrders = allOrders?.filter(o => ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status)).length || 0
    const pendingTopups = allTopups?.filter(t => t.status === 'pending').length || 0
    const totalRevenue = allOrders?.reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    const todayRevenue = allOrders?.filter(o => (o.createdAt?.seconds || 0) >= startOfToday.seconds).reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    const totalUserCoins = calculateTotalUserCoins(allUsers)
    
    const verifiedUsers = allUsers?.filter(u => u.emailVerified === true).length || 0
    const unverifiedUsers = (allUsers?.length || 0) - verifiedUsers
    const adminVerified = allUsers?.filter(u => u.adminVerified === true).length || 0
    const adminNotVerified = (allUsers?.length || 0) - adminVerified
    const premiumUsersCount = allUsers?.filter(u => u.premiumBadge === true).length || 0

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
      adminNotVerified,
      premiumUsersCount
    }
  }, [allUsers, allOrders, allTopups, marketplacePurchases, allMaterials, recentLogs])

  const statItems = [
    { label: "Total User", value: stats.totalUsers.toLocaleString(), sub: `+${stats.todayUsers} HARI INI`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", loading: usersLoading },
    { label: "User Online", value: stats.onlineUsersCount, sub: "ONLINE NOW (5 MIN)", icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10", loading: logsLoading },
    { label: "Premium Users", value: stats.premiumUsersCount, sub: "GOLD BADGE MEMBERS", icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", loading: usersLoading },
    { label: "Total Koin User", value: stats.totalUserCoins.toLocaleString(), sub: "KOIN BEREDAR", icon: Wallet, color: "text-primary", bg: "bg-primary/10", loading: usersLoading },
    { label: "Admin Verified", value: stats.adminVerified.toLocaleString(), sub: "AKUN AKTIF", icon: UserRoundCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", loading: usersLoading },
    { label: "Admin Pending", value: stats.adminNotVerified.toLocaleString(), sub: "BUTUH AKTIVASI", icon: UserRoundX, color: "text-amber-500", bg: "bg-amber-500/10", loading: usersLoading },
    { label: "Revenue", value: stats.totalRevenue.toLocaleString(), sub: `+${stats.todayRevenue} HARI INI`, icon: Coins, color: "text-green-500", bg: "bg-green-500/10", loading: ordersLoading },
    { label: "Order Aktif", value: stats.activeOrders, sub: "ANTREAN SMM", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10", loading: ordersLoading },
    { label: "Marketplace", value: stats.marketplaceSales, sub: "PRODUK TERJUAL", icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10", loading: marketLoading },
    { label: "Materi Belajar", value: stats.materiCount, sub: "LESSON ACTIVE", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10", loading: materialsLoading },
    { label: "Topup Pending", value: stats.pendingTopups, sub: "BUTUH APPROVAL", icon: CreditCard, color: "text-rose-500", bg: "bg-rose-500/10", loading: topupsLoading },
  ]

  return (
    <div className="max-w-[1400px] mx-auto pb-6 space-y-5 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight">Nexvora Dashboard</h2>
          <p className="text-muted-foreground text-xs">Sistem monitoring terpusat dan realtime.</p>
        </div>
        <div className="flex items-center gap-3">
          {apiSettings && (
             <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-1.5 rounded-full">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/60 uppercase">SMM.ID: </span>
                <span className={cn("text-xs font-bold", parseInt(providerBalance || "0") < 20000 ? "text-red-500" : "text-primary")}>
                  {isCheckingBalance ? "..." : providerBalance ? `Rp ${providerBalance}` : "Wait"}
                </span>
                <button onClick={fetchBalance} disabled={isCheckingBalance} className="hover:text-primary transition-colors ml-1">
                  <RefreshCw className={cn("h-3 w-3", isCheckingBalance && "animate-spin")} />
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Main Stat Grid - Optimized Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statItems.map((s, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden group hover:border-primary/40 transition-all duration-300 flex flex-col justify-between h-full">
            <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
               <div className={cn("p-1.5 rounded-lg transition-transform group-hover:scale-110", s.bg)}>
                 <s.icon className={cn("h-3.5 w-3.5", s.color)} />
               </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {s.loading ? (
                <Skeleton className="h-7 w-20 bg-white/5 rounded-lg" />
              ) : (
                <div className="text-xl font-headline font-black text-white truncate">{s.value}</div>
              )}
              <p className="text-[9px] text-white/30 mt-0.5 font-bold uppercase">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Summary & Quick Access */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="premium-card rounded-2xl bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="p-4 border-b border-white/5">
                <CardTitle className="text-[10px] flex items-center gap-2 text-white uppercase font-black tracking-widest">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Ringkasan Hari Ini
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4 grid grid-cols-2 gap-3">
                {[
                  { label: "User Baru", val: stats.todayUsers, loading: usersLoading },
                  { label: "Revenue", val: `${stats.todayRevenue} 🪙`, loading: ordersLoading, hl: true },
                  { label: "Topup In", val: stats.pendingTopups, loading: topupsLoading },
                  { label: "Order In", val: stats.activeOrders, loading: ordersLoading },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <p className="text-[8px] text-muted-foreground uppercase font-black mb-1">{item.label}</p>
                    {item.loading ? <Skeleton className="h-4 w-10 bg-white/5" /> : (
                      <p className={cn("text-sm font-bold text-white", item.hl && "text-primary")}>{item.val}</p>
                    )}
                  </div>
                ))}
             </CardContent>
          </Card>

          <Card className="premium-card rounded-2xl bg-black/40 border-white/5 p-4">
             <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4 flex items-center gap-2">
               <Zap className="h-3.5 w-3.5 text-primary" /> Quick Access
             </h3>
             <div className="grid grid-cols-3 gap-2">
               {[
                 { label: "Users", icon: Users, href: "/admin/users" },
                 { label: "Traffic", icon: Activity, href: "/admin/traffic" },
                 { label: "Market", icon: ShoppingBag, href: "/admin/marketplace" },
                 { label: "Wallet", icon: Wallet, href: "/admin/topup-monitor" },
                 { label: "Logs", icon: Clock, href: "/admin/activity" },
                 { label: "Settings", icon: ShieldCheck, href: "/admin/settings" },
               ].map((q, i) => (
                 <Link key={i} href={q.href}>
                   <div className="aspect-square rounded-xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                      <q.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-tighter group-hover:text-white">{q.label}</span>
                   </div>
                 </Link>
               ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Activity Logs */}
        <Card className="lg:col-span-8 premium-card rounded-2xl bg-black/40 border-white/5 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-4">
            <div>
              <CardTitle className="text-[11px] text-white font-black uppercase tracking-widest">Log Aktivitas Terbaru</CardTitle>
            </div>
            <Link href="/admin/activity">
              <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 h-7">Lihat Semua</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-[300px]">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent h-8">
                  <TableHead className="text-white font-bold py-0 text-[10px] uppercase">Event</TableHead>
                  <TableHead className="text-white font-bold py-0 text-[10px] uppercase">Keterangan</TableHead>
                  <TableHead className="text-white font-bold py-0 text-right text-[10px] uppercase">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
                ) : recentLogs?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic text-xs">Belum ada aktivitas.</TableCell></TableRow>
                ) : (
                  recentLogs?.slice(0, 10).map((log: any) => (
                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors h-11">
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          {log.type === 'admin' ? <ShieldCheck className="h-3 w-3 text-primary" /> : <Activity className="h-3 w-3 text-blue-500" />}
                          <span className="font-bold text-white text-[10px] truncate max-w-[80px]">{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px] md:max-w-[350px]">{log.details}</p>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[9px] text-white/40 font-bold">
                           <Clock className="h-2.5 w-2.5" /> {log.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
