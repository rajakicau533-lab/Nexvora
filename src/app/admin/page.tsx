
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
    if (!db) return {}
    return {
      users: collection(db, "users"),
      orders: collection(db, "traffic_orders"),
      transactions: collection(db, "coin_transactions"),
      topups: collection(db, "topup_requests")
    }
  }, [db])

  const { data: recentOrders } = useCollection<any>(
    statsQueries.orders ? query(statsQueries.orders, orderBy("createdAt", "desc"), limit(5)) : null
  )
  
  const { data: allUsers } = useCollection<any>(statsQueries.users)
  const { data: allOrders } = useCollection<any>(statsQueries.orders)
  const { data: allTopups } = useCollection<any>(statsQueries.topups)

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      <div className="space-y-2">
        <h2 className="text-4xl font-headline font-bold text-white">Executive Overview</h2>
        <p className="text-muted-foreground text-lg">System-wide metrics and performance data.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="premium-card rounded-[2rem] bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">{allUsers?.length || 0}</div>
            <p className="text-[10px] text-green-500 font-bold mt-2 uppercase">Verified Members</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-[2rem] bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Active Orders</CardTitle>
            <Activity className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">
              {allOrders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0}
            </div>
            <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase">Requires Attention</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-[2rem] bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pending Topups</CardTitle>
            <CreditCard className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">
              {allTopups?.filter(t => t.status === 'pending').length || 0}
            </div>
            <p className="text-[10px] text-primary font-bold mt-2 uppercase">Manual Verification</p>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-[2rem] bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">Growth Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-headline font-black text-white">+12.5%</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase">Last 30 Days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="premium-card lg:col-span-2 rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Recent System Activity
            </CardTitle>
            <CardDescription>Live traffic orders and processing status.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white font-bold">Target</TableHead>
                  <TableHead className="text-white font-bold">Views</TableHead>
                  <TableHead className="text-white font-bold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!recentOrders || recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">No recent orders.</TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="max-w-[150px] truncate text-xs font-mono">{order.url}</TableCell>
                      <TableCell className="text-white font-bold">{order.views.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase",
                          order.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                        )}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Admin Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 space-y-4">
             <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                <p className="text-xs font-black text-white uppercase">Critical API Alert</p>
                <p className="text-xs text-muted-foreground">Check API settings if orders are failing.</p>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-xs font-black text-white uppercase">New Topup Request</p>
                <p className="text-xs text-muted-foreground">User #8492 requested 5,000 Coins.</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
