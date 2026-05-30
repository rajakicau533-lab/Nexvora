"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Clock, ExternalLink, Filter, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function AdminTrafficMonitoringPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isAssistant = adminData?.role === 'assistant_admin';

  const ordersQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "traffic_orders"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: orders, loading } = useCollection<any>(ordersQuery)

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!db || isAssistant) return
    try {
      await updateDoc(doc(db, "traffic_orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        processedBy: user?.email
      })
      toast({ title: "Order Status Updated", description: `Order is now ${newStatus}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const stats = React.useMemo(() => {
    if (!orders) return { total: 0, pending: 0, completed: 0, coins: 0 }
    return {
      total: orders.length,
      pending: orders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length,
      completed: orders.filter((o: any) => o.status === 'completed').length,
      coins: orders.reduce((acc: number, o: any) => acc + (o.coinCost || 0), 0)
    }
  }, [orders])

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white">Traffic Control 🚀</h2>
          <p className="text-muted-foreground">Monitor and process social media booster orders.</p>
        </div>
        <div className="flex gap-4">
           <Card className="bg-black/40 border-white/5 px-6 py-2 rounded-2xl flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground uppercase font-black">Total Revenue</p>
                <p className="text-xl font-bold text-primary">{stats.coins.toLocaleString()} 🪙</p>
              </div>
           </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="premium-card bg-primary/5 border-primary/10 rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-muted-foreground uppercase mb-1">Active Orders</p>
            <p className="text-4xl font-headline font-black text-white">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="premium-card bg-black/40 rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-muted-foreground uppercase mb-1">Total Orders</p>
            <p className="text-4xl font-headline font-black text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="premium-card bg-green-500/5 border-green-500/10 rounded-3xl">
          <CardContent className="pt-6">
            <p className="text-xs font-black text-muted-foreground uppercase mb-1">Successful</p>
            <p className="text-4xl font-headline font-black text-green-500">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">Platform / Target</TableHead>
              <TableHead className="text-white font-bold">Views / Cost</TableHead>
              <TableHead className="text-white font-bold">Ordered By</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-right text-white font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
            ) : orders?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No traffic orders found.</TableCell></TableRow>
            ) : orders?.map((order) => (
              <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase">{order.platform}</span>
                    <a href={order.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 max-w-[200px] truncate">
                      {order.url} <ExternalLink className="h-2 w-2" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{order.views.toLocaleString()} Views</span>
                    <span className="text-[10px] text-muted-foreground">{order.coinCost} 🪙 Nexus Coins</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground font-mono">{order.userId?.slice(0, 8)}...</span>
                </TableCell>
                <TableCell>
                   <Badge className={cn(
                     "text-[9px] font-black uppercase",
                     order.status === 'completed' ? 'bg-green-500' : 
                     order.status === 'processing' ? 'bg-blue-600 animate-pulse' : 
                     order.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                   )}>
                     {order.status}
                   </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {!isAssistant && order.status !== 'completed' && order.status !== 'failed' && (
                    <div className="flex items-center justify-end gap-2">
                       <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "processing")} className="h-8 w-8 text-blue-500 hover:bg-blue-500/10">
                         <Clock className="h-4 w-4" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "completed")} className="h-8 w-8 text-green-500 hover:bg-green-500/10">
                         <CheckCircle2 className="h-4 w-4" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "failed")} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                         <AlertCircle className="h-4 w-4" />
                       </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}