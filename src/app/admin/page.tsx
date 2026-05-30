"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, Users, ShoppingCart, CreditCard, Activity, AlertCircle } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, limit, orderBy } from "firebase/firestore"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function AdminDashboardPage() {
  const db = useFirestore()

  const statsQueries = React.useMemo(() => {
    if (!db) return {
      users: null,
      orders: null,
      transactions: null,
      topups: null
    }
    return {
      users: collection(db, "users"),
      orders: collection(db, "traffic_orders"),
      transactions: collection(db, "coin_transactions"),
      topups: collection(db, "topup_requests")
    }
  }, [db])

  const recentOrdersQuery = React.useMemo(() => {
    if (!statsQueries.orders) return null;
    return query(statsQueries.orders, orderBy("createdAt", "desc"), limit(5));
  }, [statsQueries.orders]);

  const { data: recentOrders } = useCollection<any>(recentOrdersQuery)
  const { data: allUsers } = useCollection<any>(statsQueries.users)
  const { data: allOrders } = useCollection<any>(statsQueries.orders)
  const { data: allTopups } = useCollection<any>(statsQueries.topups)

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="space-y-1">
        <h2 className="text-3xl font-headline font-bold text-white">Executive Overview</h2>
        <p className="text-muted-foreground text-sm">Metrik performa sistem Nexvora secara realtime.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card rounded-2xl bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">{allUsers?.length || 0}</div>
            <p className="text-[9px] text-green-500 font-bold mt-2 uppercase">Verified Members</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-2xl bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Aktif</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">
              {allOrders?.filter(o => o.status === 'pending' || o.status === 'PROCESSING' || o.status === 'PENDING').length || 0}
            </div>
            <p className="text-[9px] text-amber-500 font-bold mt-2 uppercase">Requires Attention</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-2xl bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Topup Pending</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">
              {allTopups?.filter(t => t.status === 'pending').length || 0}
            </div>
            <p className="text-[9px] text-primary font-bold mt-2 uppercase">Verification Needed</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-2xl bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">+12%</div>
            <p className="text-[9px] text-muted-foreground font-bold mt-2 uppercase">Last 30 Days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <Card className="premium-card lg:col-span-8 rounded-3xl border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Activity className="h-4 w-4 text-primary" /> Traffic Monitor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.01]">
                  <TableRow className="border-white/5">
                    <TableHead className="text-white text-xs font-bold py-4">Target</TableHead>
                    <TableHead className="text-white text-xs font-bold">Views</TableHead>
                    <TableHead className="text-white text-xs font-bold text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!recentOrders || recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-xs text-muted-foreground italic">No recent activity.</TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.map((order) => (
                      <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="max-w-[200px] truncate text-[11px] font-mono text-muted-foreground">{order.targetLink || order.url}</TableCell>
                        <TableCell className="text-white font-bold text-xs">{(order.views || order.quantity || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5",
                            order.status === 'completed' || order.status === 'SELESAI' ? 'bg-green-500' : 'bg-primary'
                          )}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-2xl border-white/5 bg-black/40">
            <CardHeader className="px-6 py-6">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Admin Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
               <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">SMM API Alert</p>
                  <p className="text-[11px] text-muted-foreground">Monitor order failure rate for SMM.ID.</p>
               </div>
               <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">System Audit</p>
                  <p className="text-[11px] text-muted-foreground">Database maintenance scheduled in 48h.</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}