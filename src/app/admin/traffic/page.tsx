
"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
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
  Filter, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
  RefreshCw,
  Database
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, writeBatch, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"

const ITEMS_PER_PAGE = 8

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

  // Auth check for Assistant Admin
  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isAssistant = adminData?.role === 'assistant_admin';

  // API Config for Sync
  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  const ordersQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "traffic_orders"), orderBy("createdAt", "desc"))
  }, [db])
  const { data: orders, loading } = useCollection<any>(ordersQuery)

  const syncProviderStatus = useCallback(async () => {
    if (!db || !apiSettings || !orders || isSyncing) return;
    
    const ordersToSync = orders.filter(o => 
      ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status) && o.providerOrderId
    ).slice(0, 10); // Batch sync 10 at a time to avoid rate limit

    if (ordersToSync.length === 0) return;

    setIsSyncing(true);
    let updatedCount = 0;

    try {
      for (const order of ordersToSync) {
        const result = await checkOrderStatus({
          apiUrl: apiSettings.apiUrl,
          apiKey: apiSettings.apiKey,
          orderId: order.providerOrderId
        });

        if (result.success && result.status) {
          const rawStatus = result.status.toLowerCase();
          let mappedStatus = "PENDING";

          if (["processing", "in progress", "in_progress"].includes(rawStatus)) mappedStatus = "PROCESSING";
          else if (["completed", "success", "finished"].includes(rawStatus)) mappedStatus = "COMPLETED";
          else if (["partial"].includes(rawStatus)) mappedStatus = "PARTIAL";
          else if (["cancelled", "canceled", "failed"].includes(rawStatus)) mappedStatus = "CANCELLED";

          if (mappedStatus !== order.status) {
            await updateDoc(doc(db, "traffic_orders", order.id), {
              status: mappedStatus,
              updatedAt: serverTimestamp(),
              lastSyncAt: serverTimestamp()
            });
            updatedCount++;
          }
        }
      }
      if (updatedCount > 0) {
        toast({ title: "Sinkronisasi Berhasil", description: `${updatedCount} status pesanan diperbarui dari provider.` });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [db, apiSettings, orders, isSyncing, toast]);

  // Auto sync on mount
  useEffect(() => {
    if (orders && orders.length > 0 && apiSettings) {
      syncProviderStatus();
    }
  }, [orders?.length, !!apiSettings]);

  // Filtering & Searching Logic
  const filteredOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter(order => {
      const matchesSearch = 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.providerOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.targetLink?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.serviceLabel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.platform?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = 
        statusFilter === "all" || 
        order.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredOrders, currentPage])

  // Stats Logic
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, completed: 0, coins: 0 }
    return {
      total: orders.length,
      pending: orders.filter((o: any) => ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status)).length,
      completed: orders.filter((o: any) => ["COMPLETED", "SELESAI", "success", "Completed"].includes(o.status)).length,
      coins: orders.reduce((acc: number, o: any) => acc + (o.coinCost || 0), 0)
    }
  }, [orders])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!db || isAssistant) return
    try {
      await updateDoc(doc(db, "traffic_orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        processedBy: user?.email
      })
      toast({ title: "Status Berhasil Diperbarui", description: `Order ${orderId.slice(0,8)} menjadi ${newStatus}.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Update", description: err.message })
    }
  }

  const handleDeleteSingle = async (orderId: string) => {
    if (!db || isAssistant) return
    try {
      await deleteDoc(doc(db, "traffic_orders", orderId))
      toast({ title: "Order Dihapus", description: "Satu riwayat pesanan telah dibersihkan." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: err.message })
    }
  }

  const handleDeleteBulk = async () => {
    if (!db || isAssistant || selectedOrders.length === 0) return
    setIsDeleting(true)
    try {
      const batch = writeBatch(db)
      selectedOrders.forEach(id => {
        batch.delete(doc(db, "traffic_orders", id))
      })
      await batch.commit()
      setSelectedOrders([])
      toast({ title: "Penghapusan Berhasil", description: `${selectedOrders.length} riwayat order telah dihapus.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!db || isAssistant || !orders) return
    setIsDeleting(true)
    try {
      const batch = writeBatch(db)
      orders.forEach((o: any) => {
        batch.delete(doc(db, "traffic_orders", o.id))
      })
      await batch.commit()
      toast({ title: "Database Dibersihkan", description: "Seluruh riwayat order telah dihapus." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(paginatedOrders.map(o => o.id))
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-white">Traffic Control 🚀</h2>
          <p className="text-muted-foreground text-sm">Monitor dan sinkronisasi pesanan SMM secara realtime.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => syncProviderStatus()} disabled={isSyncing || !apiSettings} variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary font-bold h-12">
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Sync Provider Status
          </Button>
          <Card className="bg-black/40 border-white/5 px-6 py-2 h-12 rounded-2xl flex items-center gap-4 w-fit">
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase font-black">Total Revenue</p>
              <p className="text-xl font-bold text-primary">{stats.coins.toLocaleString()} 🪙</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Active Orders", value: stats.pending, color: "text-amber-500", bg: "bg-amber-500/5" },
          { label: "Total Orders", value: stats.total, color: "text-white", bg: "bg-white/5" },
          { label: "Successful", value: stats.completed, color: "text-green-500", bg: "bg-green-500/5" },
          { label: "Revenue", value: `${stats.coins} 🪙`, color: "text-primary", bg: "bg-primary/5" }
        ].map((s, i) => (
          <Card key={i} className={cn("premium-card border-none rounded-3xl", s.bg)}>
            <CardContent className="pt-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">{s.label}</p>
              <p className={cn("text-2xl md:text-3xl font-headline font-black", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari order, provider ID, atau link..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-black/40 border-white/10 rounded-xl h-12"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'processing', 'completed', 'partial', 'cancelled'].map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
              className={cn(
                "rounded-xl h-12 px-5 font-bold capitalize transition-all",
                statusFilter === f ? "bg-primary shadow-lg shadow-primary/20" : "bg-black/40 border-white/10"
              )}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedOrders.length > 0 && !isAssistant && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-xl font-bold animate-in fade-in slide-in-from-left-2">
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus ({selectedOrders.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-black/95 border-white/10 text-white rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Order Terpilih?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    Anda akan menghapus {selectedOrders.length} riwayat pesanan. Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-none">Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteBulk} className="bg-red-600 hover:bg-red-700">Hapus Sekarang</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        {!isAssistant && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500 rounded-xl font-bold">
                <Trash2 className="h-4 w-4 mr-2" /> Bersihkan Semua Riwayat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black/95 border-white/10 text-white rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-500">WASPADA: Hapus Semua Riwayat?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Ini akan menghapus seluruh data order di sistem. Pastikan Anda sudah melakukan audit bulanan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-none">Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">Ya, Hapus Semua</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Orders List */}
      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="w-12">
                   {!isAssistant && (
                     <Checkbox 
                        checked={selectedOrders.length > 0 && selectedOrders.length === paginatedOrders.length} 
                        onCheckedChange={toggleSelectAll} 
                        className="border-white/20 data-[state=checked]:bg-primary"
                     />
                   )}
                </TableHead>
                <TableHead className="text-white font-bold">Service / Link</TableHead>
                <TableHead className="text-white font-bold">ID / Provider</TableHead>
                <TableHead className="text-white font-bold">Qty / Cost</TableHead>
                <TableHead className="text-white font-bold">Status</TableHead>
                <TableHead className="text-white font-bold">Waktu</TableHead>
                <TableHead className="text-right text-white font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground italic">Tidak ada pesanan ditemukan.</TableCell></TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                    <TableCell>
                       {!isAssistant && (
                         <Checkbox 
                            checked={selectedOrders.includes(order.id)} 
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                            className="border-white/20 data-[state=checked]:bg-primary"
                         />
                       )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase">{order.serviceLabel || order.platform}</span>
                        <a href={order.targetLink || order.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 max-w-[200px] truncate">
                          {order.targetLink || order.url} <ExternalLink className="h-2 w-2" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="text-[10px] text-white/40 uppercase font-bold">NXV: {order.id?.slice(-6).toUpperCase()}</span>
                         <span className="text-[10px] text-primary font-black">SMM: {order.providerOrderId || "-"}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{(order.views || order.quantity || 0).toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">{order.coinCost} 🪙</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge className={cn(
                         "text-[9px] font-black uppercase px-2 py-0.5",
                         ["COMPLETED", "SELESAI", "success"].includes(order.status) ? 'bg-green-500' : 
                         ["PROCESSING", "processing", "in progress"].includes(order.status) ? 'bg-blue-600 animate-pulse' : 
                         ["CANCELLED", "FAILED", "failed"].includes(order.status) ? 'bg-red-500' : 
                         order.status === "PARTIAL" ? 'bg-orange-500' : 'bg-amber-500'
                       )}>
                         {order.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground uppercase font-bold">
                       {order.createdAt?.toDate?.().toLocaleDateString()} <br />
                       <span className="opacity-50">{order.createdAt?.toDate?.().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isAssistant && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "PROCESSING")} title="Proses" className="h-8 w-8 text-blue-500 hover:bg-blue-500/10">
                             <Clock className="h-4 w-4" />
                           </Button>
                           <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "COMPLETED")} title="Selesai" className="h-8 w-8 text-green-500 hover:bg-green-500/10">
                             <CheckCircle2 className="h-4 w-4" />
                           </Button>
                           <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "CANCELLED")} title="Gagal" className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                             <AlertCircle className="h-4 w-4" />
                           </Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/20 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-black/95 border-white/10 text-white rounded-3xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Permanen?</AlertDialogTitle>
                                  <AlertDialogDescription>Data tidak bisa dikembalikan setelah dihapus.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-none">Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSingle(order.id)} className="bg-red-600">Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                           </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden p-4 space-y-4">
           {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
           ) : paginatedOrders.length === 0 ? (
             <p className="text-center text-muted-foreground text-sm py-10">Data kosong.</p>
           ) : (
             paginatedOrders.map((order) => (
               <div key={order.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       {!isAssistant && (
                         <Checkbox 
                            checked={selectedOrders.includes(order.id)} 
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                            className="border-white/20 rounded-lg"
                         />
                       )}
                       <div>
                         <p className="text-[10px] font-black text-primary uppercase">{order.serviceLabel || order.platform}</p>
                         <p className="text-[11px] font-bold text-white max-w-[150px] truncate">{order.targetLink || order.url}</p>
                         <p className="text-[9px] text-muted-foreground font-mono mt-1">SMM ID: {order.providerOrderId || "-"}</p>
                       </div>
                    </div>
                    <Badge className={cn(
                        "text-[8px] font-black uppercase",
                        ["COMPLETED", "SELESAI", "success"].includes(order.status) ? 'bg-green-500' : 'bg-amber-500'
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px]">
                     <div className="space-y-1">
                        <p className="text-muted-foreground uppercase font-black text-[9px]">Jumlah</p>
                        <p className="text-white font-bold">{(order.views || order.quantity || 0).toLocaleString()}</p>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-muted-foreground uppercase font-black text-[9px]">Biaya</p>
                        <p className="text-primary font-bold">{order.coinCost} 🪙</p>
                     </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-white/5">
                     <p className="text-[10px] text-muted-foreground italic">{new Date(order.createdAt?.toDate()).toLocaleString()}</p>
                     {!isAssistant && (
                       <div className="flex gap-1">
                         <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "COMPLETED")} className="h-8 w-8 text-green-500 bg-green-500/5 rounded-lg"><CheckCircle2 className="h-4 w-4" /></Button>
                         <Button size="icon" variant="ghost" onClick={() => handleDeleteSingle(order.id)} className="h-8 w-8 text-red-500 bg-red-500/5 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                       </div>
                     )}
                  </div>
               </div>
             ))
           )}
        </div>
      </Card>

      {/* Pagination Nav */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <p className="text-xs text-muted-foreground font-medium">
            Menampilkan <span className="text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> sampai <span className="text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> dari <span className="text-white">{filteredOrders.length}</span> order
          </p>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="rounded-xl border-white/10 bg-black/40 h-10 w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-1">
               {Array.from({ length: totalPages }, (_, i) => i + 1)
                 .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                 .map((p, idx, arr) => (
                   <React.Fragment key={p}>
                     {idx > 0 && arr[idx-1] !== p - 1 && <span className="px-2 text-muted-foreground">...</span>}
                     <Button
                       variant={currentPage === p ? "default" : "outline"}
                       onClick={() => setCurrentPage(p)}
                       className={cn(
                         "rounded-xl h-10 w-10 font-bold transition-all",
                         currentPage === p ? "bg-primary shadow-lg shadow-primary/30 scale-110" : "bg-black/40 border-white/10"
                       )}
                     >
                       {p}
                     </Button>
                   </React.Fragment>
                 ))
               }
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="rounded-xl border-white/10 bg-black/40 h-10 w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
