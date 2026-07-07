"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Activity, 
  CreditCard, 
  TrendingUp, 
  ShoppingBag, 
  BookOpen, 
  Coins, 
  Clock,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  Wallet,
  UserCheck,
  UserRoundCheck,
  UserRoundX,
  Crown
} from "lucide-react"
import { useFirestore, useCollection, useDoc, useUser } from "@/firebase"
import { collection, query, limit, orderBy, where, Timestamp, doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { checkProviderBalance } from "@/ai/flows/process-traffic-order-flow"
import { calculateTotalUserCoins } from "@/lib/admin-stats-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminDashboardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [providerBalance, setProviderBalance] = useState<string | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)

  // Stable API Config & Role
  const adminProfileRef = React.useMemo(() => (db && user?.uid ? doc(db, "admins", user.uid) : null), [db, user?.uid])
  const { data: adminData } = useDoc(adminProfileRef)
  const isMaster = adminData?.role === 'super_admin' || user?.email === 'adheprogramer@gmail.com';

  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  // Basic Queries
  const usersQuery = React.useMemo(() => (db ? collection(db, "users") : null), [db])
  const { data: allUsers, loading: usersLoading } = useCollection<any>(usersQuery)
  
  const ordersQuery = React.useMemo(() => (db ? collection(db, "traffic_orders") : null), [db])
  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery)

  // Activity Logs
  const recentLogsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(50))
  }, [db])
  const { data: recentLogs, loading: logsLoading } = useCollection<any>(recentLogsQuery)

  const fetchBalance = async () => {
    if (!isMaster || !apiSettings?.apiUrl || !apiSettings?.apiKey || isCheckingBalance) return
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
    if (apiSettings && isMaster) fetchBalance()
  }, [!!apiSettings, isMaster])

  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Timestamp(Math.floor(new Date(now.setHours(0,0,0,0)).getTime() / 1000), 0)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)

    const todayUsers = allUsers?.filter(u => (u.createdAt?.seconds || 0) >= startOfToday.seconds).length || 0
    const activeOrders = allOrders?.filter(o => ["PENDING", "PROCESSING"].includes(o.status?.toUpperCase())).length || 0
    const totalUserCoins = calculateTotalUserCoins(allUsers)
    
    const verifiedUsers = allUsers?.filter(u => u.adminVerified === true).length || 0
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
      verifiedUsers,
      onlineUsersCount,
      premiumUsersCount,
      todayRevenue: allOrders?.filter(o => (o.createdAt?.seconds || 0) >= startOfToday.seconds).reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0,
      totalRevenue: allOrders?.reduce((acc, o) => acc + (o.coinCost || 0), 0) || 0
    }
  }, [allUsers, allOrders, recentLogs])

  const statItems = [
    { label: "Total User", value: stats.totalUsers.toLocaleString(), sub: `+${stats.todayUsers} HARI INI`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", loading: usersLoading },
    { label: "User Online", value: stats.onlineUsersCount, sub: "AKTIF 5 MENIT TERAKHIR", icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10", loading: logsLoading },
    { label: "Premium Users", value: stats.premiumUsersCount, sub: "GOLD MEMBERS", icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10", loading: usersLoading },
    { label: "Verified Users", value: stats.verifiedUsers, sub: "AKUN TERVALIDASI", icon: UserRoundCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", loading: usersLoading },
  ]

  // Master only stats
  const masterStats = [
    { label: "Total Koin User", value: stats.totalUserCoins.toLocaleString(), sub: "KOIN BEREDAR", icon: Wallet, color: "text-primary", bg: "bg-primary/10", loading: usersLoading },
    { label: "Revenue", value: stats.totalRevenue.toLocaleString(), sub: `+${stats.todayRevenue} HARI INI`, icon: Coins, color: "text-green-500", bg: "bg-green-500/10", loading: ordersLoading },
  ]

  const currentStats = isMaster ? [...statItems, ...masterStats] : statItems;

  return (
    <div className="max-w-[1400px] mx-auto pb-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-headline font-bold text-white tracking-tight">Nexvora {isMaster ? 'Master Control' : 'Admin Panel'}</h2>
          <p className="text-muted-foreground text-xs">{isMaster ? 'Sistem monitoring terpusat dan manajemen tim.' : 'Monitoring operasional dan manajemen pengguna.'}</p>
        </div>
        
        {isMaster && apiSettings && (
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 px-4 py-1.5 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-white/60 uppercase">SMM.ID BALANCE: </span>
            <span className={cn("text-xs font-bold", parseInt(providerBalance || "0") < 20000 ? "text-red-500" : "text-primary")}>
              {isCheckingBalance ? "..." : providerBalance ? `Rp ${providerBalance}` : "Wait"}
            </span>
            <button onClick={fetchBalance} disabled={isCheckingBalance} className="hover:text-primary transition-colors ml-1">
              <RefreshCw className={cn("h-3 w-3", isCheckingBalance && "animate-spin")} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentStats.map((s, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden group hover:border-primary/40 transition-all duration-300">
            <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
               <div className={cn("p-1.5 rounded-lg", s.bg)}>
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

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 space-y-5">
          <Card className="premium-card rounded-2xl bg-black/40 border-white/5 p-4">
             <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-4 flex items-center gap-2">
               <Zap className="h-3.5 w-3.5 text-primary" /> Quick Access
             </h3>
             <div className="grid grid-cols-3 gap-2">
               {[
                 { label: "Users", icon: Users, href: "/admin/users" },
                 { label: "Traffic", icon: Activity, href: "/admin/traffic" },
                 { label: "Market", icon: ShoppingBag, href: "/admin/marketplace", master: true },
                 { label: "Wallet", icon: Wallet, href: "/admin/topup-monitor", master: true },
                 { label: "Logs", icon: Clock, href: "/admin/activity", master: true },
                 { label: "Admin", icon: ShieldCheck, href: "/admin/admins", master: true },
               ].filter(q => !q.master || isMaster).map((q, i) => (
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

        <Card className="lg:col-span-8 premium-card rounded-2xl bg-black/40 border-white/5 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-4">
            <CardTitle className="text-[11px] text-white font-black uppercase tracking-widest">Aktivitas Sistem Terbaru</CardTitle>
            {isMaster && (
              <Link href="/admin/activity">
                <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-primary hover:bg-primary/10 h-7">Audit</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent h-8">
                  <TableHead className="text-white font-bold py-0 text-[10px] uppercase">Admin</TableHead>
                  <TableHead className="text-white font-bold py-0 text-[10px] uppercase">Aksi</TableHead>
                  <TableHead className="text-white font-bold py-0 text-right text-[10px] uppercase">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-5 w-5" /></TableCell></TableRow>
                ) : recentLogs?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-xs">Belum ada aktivitas.</TableCell></TableRow>
                ) : (
                  recentLogs?.slice(0, 8).map((log: any) => (
                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] h-11">
                      <TableCell className="py-2">
                        <span className="font-bold text-white text-[10px]">{log.userEmail?.split('@')[0] || log.userId?.slice(0, 5)}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-[10px] text-muted-foreground truncate max-w-[250px]">{log.action}: {log.details}</p>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1 text-[9px] text-white/40 font-bold">
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
