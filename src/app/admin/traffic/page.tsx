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
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, writeBatch } from "firebase/firestore"
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

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  const { data: adminData } = useDoc(adminProfileRef);
  const isAssistant = adminData?.role === 'assistant_admin';

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
    ).slice(0, 10);

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
              updatedAt: serverTimestamp()
            });
            updatedCount++;
          }
        }
      }
      if (updatedCount > 0) {
        toast({ title: "Sinkronisasi Berhasil", description: `${updatedCount} status diperbarui.` });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [db, apiSettings, orders, isSyncing, toast]);

  const filteredOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter(order => {
      const matchesSearch = 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.providerOrderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.targetLink?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = 
        statusFilter === "all" || 
        order.status?.toLowerCase() === statusFilter.toLowerCase()

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
      await updateDoc(doc(db, "traffic_orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      })
      toast({ title: "Status Diperbarui" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    }
  }

  const handleDeleteSingle = async (orderId: string) => {
    if (!db || isAssistant) return
    try {
      await deleteDoc(doc(db, "traffic_orders", orderId))
      toast({ title: "Dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  const handleDeleteBulk = async () => {
    if (!db || isAssistant || selectedOrders.length === 0) return
    setIsDeleting(true)
    try {
      const batch = writeBatch(db)
      selectedOrders.forEach(id => { batch.delete(doc(db, "traffic_orders", id)) })
      await batch.commit()
      setSelectedOrders([])
      toast({ title: "Berhasil dihapus" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white">Traffic Control 🚀</h2>
          <p className="text-muted-foreground text-sm">Monitoring seluruh aktivitas trafik Nexvora.</p>
        </div>
        <Button onClick={() => syncProviderStatus()} disabled={isSyncing} variant="outline" className="rounded-xl border-white/10 h-12">
          {isSyncing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync Status
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari order, provider ID, atau link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/40 border-white/10 h-12"
          />
        </div>
        <div className="flex gap-2">
           {selectedOrders.length > 0 && (
             <Button variant="destructive" onClick={handleDeleteBulk} disabled={isDeleting}>Hapus ({selectedOrders.length})</Button>
           )}
        </div>
      </div>

      <Card className="premium-card rounded-[2rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="w-12"></TableHead>
              <TableHead className="text-white font-bold">Service / Link</TableHead>
              <TableHead className="text-white font-bold">Qty / Cost</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-right text-white font-bold px-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Tidak ada pesanan.</TableCell></TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id} className="border-white/5 hover:bg-white/5 group">
                  <TableCell>
                    <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={(val) => {
                      if (val) setSelectedOrders([...selectedOrders, order.id])
                      else setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                    }} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-primary uppercase">{order.serviceLabel}</span>
                      <a href={order.targetLink} target="_blank" className="text-xs text-muted-foreground hover:text-white max-w-[200px] truncate">{order.targetLink}</a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{(order.quantity || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">{order.coinCost} 🪙</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <Badge className={cn(
                       "text-[9px] font-black uppercase",
                       ["COMPLETED", "SELESAI", "success"].includes(order.status) ? 'bg-green-500' : 'bg-amber-500'
                     )}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    {!isAssistant && (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" onClick={() => handleUpdateStatus(order.id, "COMPLETED")} className="h-8 w-8 text-green-500"><CheckCircle2 className="h-4 w-4" /></Button>
                         <Button size="icon" variant="ghost" onClick={() => handleDeleteSingle(order.id)} className="h-8 w-8 text-white/20 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Halaman {currentPage} dari {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
