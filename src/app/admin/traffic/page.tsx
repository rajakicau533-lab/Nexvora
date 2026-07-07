"use client"

import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  TrendingUp, 
  Clock, 
  ExternalLink, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  ChevronDown,
  XCircle,
  Zap,
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
  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isAssistant = adminData?.role === 'assistant_admin';

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
      pending: orders.filter(o => ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status)).length,
      success: orders.filter(o => ["COMPLETED", "SUCCESS", "Selesai"].includes(o.status.toUpperCase())).length,
      failed: orders.filter(o => ["FAILED", "CANCELLED", "Gagal"].includes(o.status.toUpperCase())).length,
    }
  }, [orders])

  const statItems = [
    { label: "Total Order", value: stats.total, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Success", value: stats.success, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ]

  const syncProviderStatus = useCallback(async () => {
    if (!db || !apiSettings || !orders || isSyncing) return;
    const ordersToSync = orders.filter(o => 
      ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status) && o.providerOrderId
    ).slice(0, 10);
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
            await updateDoc(doc(db, "traffic_orders", order.id), {
              status: mappedStatus,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
      toast({ title: "Sinkronisasi Selesai" });
    } finally {
      setIsSyncing(false);
    }
  }, [db, apiSettings, orders, isSyncing, toast]);

  const handleCleanup = async (type: 'completed' | 'failed' | 'old' | 'all') => {
    if (!db || isAssistant) return
    const msg = type === 'old' ? "Hapus seluruh history yang lebih dari 3 hari?" : `Hapus history dengan status ${type.toUpperCase()}?`;
    if (!confirm(msg)) return
    setIsCleaning(true)
    try {
      const deletedCount = await cleanupTrafficHistory(db, type)
      toast({ title: "Pembersihan Sukses", description: `${deletedCount} data telah dihapus.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    } finally {
      setIsCleaning(false)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter(order => {
      const matchesSearch = 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.providerOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.targetLink?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!db || isAssistant) return
    try {
      await updateDoc(doc(db, "traffic_orders", orderId), { status: newStatus, updatedAt: serverTimestamp() })
      toast({ title: "Status Diperbarui" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    }
  }

  const handleDeleteBulk = async () => {
    if (!db || isAssistant || selectedOrders.length === 0) return
    if (!confirm("Hapus pesanan terpilih?")) return
    setIsDeleting(true)
    try {
      const batch = writeBatch(db)
      selectedOrders.forEach(id => { batch.delete(doc(db, "traffic_orders", id)) })
      await batch.commit()
      setSelectedOrders([])
      toast({ title: "Berhasil dihapus" })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Connecting Traffic Database...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            Traffic Control <Activity className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground text-sm">Pemantauan seluruh aktivitas trafik Nexvora secara terpadu.</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button 
                disabled={isCleaning}
                variant="outline" 
                className="rounded-xl border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 h-12 font-bold px-6"
               >
                 {isCleaning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                 BERSIHKAN HISTORY <ChevronDown className="ml-2 h-4 w-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white rounded-xl">
              <DropdownMenuItem onClick={() => handleCleanup('completed')} className="cursor-pointer hover:bg-primary/20">Bersihkan Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCleanup('failed')} className="cursor-pointer hover:bg-primary/20">Bersihkan Failed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCleanup('old')} className="cursor-pointer text-red-500 font-bold hover:bg-red-500/10 underline">Hapus History &gt; 3 Hari</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => syncProviderStatus()} disabled={isSyncing} variant="outline" className="rounded-xl border-white/10 bg-white/5 h-12 font-bold px-6">
            {isSyncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            SYNC STATUS
          </Button>
        </div>
      </div>

      {/* Stat Cards 2x2 Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, i) => (
          <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.label}</p>
               <div className={cn("p-1.5 rounded-lg", item.bg)}>
                 <item.icon className={cn("h-3.5 w-3.5", item.color)} />
               </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl md:text-2xl font-headline font-black text-white">{item.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari order ID, email, atau link..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'processing', 'completed', 'failed'].map((f) => (
                  <Button
                    key={f}
                    variant={statusFilter === f ? "default" : "outline"}
                    onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
                    className={cn(
                      "rounded-xl h-12 px-5 font-black uppercase text-[10px] tracking-widest transition-all",
                      statusFilter === f ? "bg-primary shadow-lg shadow-primary/20" : "bg-black/40 border-white/10"
                    )}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            {selectedOrders.length > 0 && (
              <div className="pt-4 flex items-center gap-4 animate-in slide-in-from-top-2">
                 <p className="text-xs font-bold text-primary">{selectedOrders.length} Pesanan Terpilih</p>
                 <Button size="sm" variant="destructive" onClick={handleDeleteBulk} disabled={isDeleting} className="rounded-lg h-8 px-4 font-bold text-[10px]">HAPUS TERPILIH</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.5rem] overflow-hidden border border-white/5">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="w-12 px-4">
                       <Checkbox checked={selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0} onCheckedChange={(val) => {
                         if (val) setSelectedOrders(paginatedOrders.map(o => o.id));
                         else setSelectedOrders([]);
                       }} />
                    </TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase">Service / User</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase">Qty / Cost</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase">Status</TableHead>
                    <TableHead className="text-white font-bold text-xs uppercase">Waktu</TableHead>
                    <TableHead className="text-right text-white font-bold text-xs uppercase px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">Tidak ada pesanan.</TableCell></TableRow>
                  ) : (
                    paginatedOrders.map((order) => (
                      <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                        <TableCell className="px-4">
                          <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={(val) => {
                            if (val) setSelectedOrders([...selectedOrders, order.id])
                            else setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                          }} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-black text-primary uppercase leading-none mb-1">{order.serviceLabel || "Traffic Order"}</span>
                            <span className="font-bold text-white text-xs">{order.userEmail || order.userId?.slice(0, 8)}</span>
                            <a href={order.targetLink} target="_blank" className="text-[9px] text-muted-foreground hover:text-white truncate max-w-[150px] flex items-center gap-1">
                               <ExternalLink className="h-2.5 w-2.5" /> Link Target
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-xs">{(order.quantity || 0).toLocaleString()}</span>
                            <span className="text-[9px] text-muted-foreground">{order.coinCost} 🪙</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge className={cn(
                             "text-[8px] font-black uppercase px-2",
                             ["COMPLETED", "SUCCESS", "Selesai"].includes(order.status.toUpperCase()) ? 'bg-green-500' : 
                             ["FAILED", "CANCELLED"].includes(order.status.toUpperCase()) ? 'bg-red-500' : 'bg-amber-500'
                           )}>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-[9px] text-muted-foreground uppercase font-bold">
                           {order.createdAt?.toDate?.().toLocaleDateString()} <br/>
                           <span className="opacity-50">{order.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          {!isAssistant && (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "COMPLETED")} className="h-8 w-8 text-green-500 hover:bg-green-500/10"><CheckCircle2 className="h-4 w-4" /></Button>
                               <Button size="icon" variant="ghost" onClick={() => { if(confirm("Hapus order ini?")) deleteDoc(doc(db, "traffic_orders", order.id)) }} className="h-8 w-8 text-white/20 hover:text-red-500 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
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

      <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Informasi Traffic Control</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            History trafik secara otomatis disaring untuk 500 data terbaru demi performa. Gunakan fitur pembersihan berkala untuk menghapus data lama (di atas 3 hari) agar penyimpanan database tetap efisien.
          </p>
        </div>
      </div>
    </div>
  )
}
