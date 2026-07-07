"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Clock, 
  ExternalLink, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  ChevronDown,
  XCircle,
  Activity
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, writeBatch, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"
import { cleanupTrafficHistory } from "@/lib/traffic-management-service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ITEMS_PER_PAGE = 10

export default function AdminTrafficMonitoringPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)

  // Auth & API Settings
  const adminProfileRef = React.useMemo(() => (db && user?.uid ? doc(db, "admins", user.uid) : null), [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isMaster = adminData?.role === 'super_admin' || user?.email === 'adheprogramer@gmail.com';

  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  // Data Fetching
  const ordersQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "traffic_orders"), orderBy("createdAt", "desc"), limit(500))
  }, [db])
  const { data: orders, loading } = useCollection<any>(ordersQuery)

  // Aggregated Stats
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, success: 0, failed: 0 };
    return {
      total: orders.length,
      pending: orders.filter(o => ["PENDING", "PROCESSING"].includes(o.status?.toUpperCase())).length,
      success: orders.filter(o => ["COMPLETED", "SUCCESS"].includes(o.status?.toUpperCase())).length,
      failed: orders.filter(o => ["FAILED", "CANCELLED"].includes(o.status?.toUpperCase())).length,
    }
  }, [orders])

  const statItems = [
    { label: "Total Order", value: stats.total, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Success", value: stats.success, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ]

  const syncProviderStatus = useCallback(async () => {
    if (!db || !apiSettings || !orders || isSyncing || !isMaster) return;
    const ordersToSync = orders.filter(o => ["PENDING", "PROCESSING"].includes(o.status?.toUpperCase()) && o.providerOrderId).slice(0, 5);
    if (ordersToSync.length === 0) return;
    setIsSyncing(true);
    try {
      for (const order of ordersToSync) {
        const result = await checkOrderStatus({
          apiUrl: apiSettings.apiUrl,
          apiKey: apiSettings.apiKey,
          orderId: order.providerOrderId
        });
        if (result.success && result.status) {
          const mappedStatus = result.status.toUpperCase();
          if (mappedStatus !== order.status) {
            await updateDoc(doc(db, "traffic_orders", order.id), { status: mappedStatus, updatedAt: serverTimestamp() });
          }
        }
      }
      toast({ title: "Sync Complete" });
    } finally {
      setIsSyncing(false);
    }
  }, [db, apiSettings, orders, isSyncing, toast, isMaster]);

  const handleCleanup = async (type: any) => {
    if (!db || !isMaster) return
    setIsCleaning(true)
    try {
      const deletedCount = await cleanupTrafficHistory(db, type)
      toast({ title: "History Cleaned", description: `${deletedCount} records deleted.` })
    } finally {
      setIsCleaning(false)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter(order => {
      const matchesSearch = (order.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    })
  }, [orders, searchTerm, statusFilter])

  const paginatedOrders = useMemo(() => filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [filteredOrders, currentPage])
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            Traffic Monitoring <Activity className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground text-sm">Monitoring operasional seluruh pesanan trafik Nexvora.</p>
        </div>
        <div className="flex gap-3">
          {isMaster && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={isCleaning} variant="outline" className="rounded-xl border-white/10 h-12 font-bold px-6">
                    {isCleaning ? <Loader2 className="animate-spin mr-2 h-4" /> : <Trash2 className="mr-2 h-4" />}
                    CLEAN HISTORY <ChevronDown className="ml-2 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/95 border-white/10 text-white rounded-xl">
                  <DropdownMenuItem onClick={() => handleCleanup('completed')}>Clean Completed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCleanup('failed')}>Clean Failed</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCleanup('old')} className="text-red-500">Delete &gt; 3 Days</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => syncProviderStatus()} disabled={isSyncing} variant="outline" className="rounded-xl border-white/10 h-12 font-bold px-6">
                {isSyncing ? <Loader2 className="animate-spin mr-2 h-4" /> : <RefreshCw className="mr-2 h-4" />}
                SYNC STATUS
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-2">
               <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
               <div className={cn("p-1.5 rounded-lg", item.bg)}><item.icon className={cn("h-3.5 w-3.5", item.color)} /></div>
            </div>
            <div className="text-2xl font-headline font-black text-white">{item.value.toLocaleString()}</div>
          </Card>
        ))}
      </div>

      <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari email user..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10 bg-white/5 border-white/10 rounded-xl h-11" />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'processing', 'completed', 'failed'].map((f) => (
                <Button key={f} variant={statusFilter === f ? "default" : "outline"} onClick={() => { setStatusFilter(f); setCurrentPage(1); }} className={cn("rounded-xl h-11 px-4 text-[9px] font-black uppercase", statusFilter === f ? "bg-primary" : "bg-black/40 border-white/10")}>{f}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-white font-bold text-xs uppercase">Service / User</TableHead>
                <TableHead className="text-white font-bold text-xs uppercase">Qty / Cost</TableHead>
                <TableHead className="text-white font-bold text-xs uppercase">Status</TableHead>
                <TableHead className="text-white font-bold text-xs uppercase">Time</TableHead>
                {isMaster && <TableHead className="text-right text-white font-bold text-xs uppercase">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase">{order.serviceLabel || "Traffic"}</span>
                      <span className="font-bold text-white text-xs">{order.userEmail || order.userId?.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-xs">{(order.quantity || 0).toLocaleString()}</span>
                      <span className="text-[9px] text-muted-foreground">{order.coinCost} 🪙</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[8px] font-black uppercase px-2",
                      ["COMPLETED", "SUCCESS"].includes(order.status?.toUpperCase()) ? 'bg-green-500' : 
                      ["FAILED", "CANCELLED"].includes(order.status?.toUpperCase()) ? 'bg-red-500' : 'bg-amber-500'
                    )}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-[9px] text-muted-foreground uppercase font-bold">
                    {order.createdAt?.toDate?.().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  {isMaster && (
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => deleteDoc(doc(db, "traffic_orders", order.id))} className="h-8 w-8 text-white/20 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-white/10 h-10 w-10"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-white/10 h-10 w-10"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
