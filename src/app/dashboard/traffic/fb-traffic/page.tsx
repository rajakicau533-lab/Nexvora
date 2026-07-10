"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Clock, ExternalLink, Loader2, Info, RefreshCw, AlertTriangle, Facebook } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, updateDoc, increment, serverTimestamp, query, where, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder, checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"
import { TRAFFIC_SERVICES } from "@/lib/constants"

export default function FacebookTrafficPage() {
  const [url, setUrl] = useState("")
  const [quantity, setQuantity] = useState(1000)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const serviceConfig = TRAFFIC_SERVICES.FB_TRAFFIC
  const coinCost = Math.ceil(quantity / serviceConfig.rate_view_per_coin)

  // Fetch API configuration
  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings, loading: settingsLoading } = useDoc(apiSettingsRef)

  // User Profile for coins
  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // Order history
  const historyQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "traffic_orders"), 
      where("userId", "==", user.uid),
      where("platform", "==", "facebook")
    )
  }, [db, user?.uid])

  const { data: allHistory, loading: historyLoading } = useCollection<any>(historyQuery)

  const history = React.useMemo(() => {
    if (!allHistory) return []
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    return [...allHistory]
      .filter(order => {
        const createdAt = order.createdAt?.toDate?.() || new Date()
        return createdAt >= threeDaysAgo && order.serviceLabel === serviceConfig.label
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0
        return timeB - timeA
      })
  }, [allHistory, serviceConfig.label])

  const syncStatus = useCallback(async () => {
    if (!db || !apiSettings || !history || history.length === 0 || isSyncing) return;
    
    const activeOrders = history.filter(o => ["PENDING", "PROCESSING"].includes(o.status?.toUpperCase()));
    if (activeOrders.length === 0) return;

    setIsSyncing(true);
    try {
      for (const order of activeOrders) {
        if (!order.providerOrderId) continue;

        const result = await checkOrderStatus({
          apiUrl: apiSettings.apiUrl,
          apiKey: apiSettings.apiKey,
          orderId: order.providerOrderId
        });

        if (result.success && result.status) {
          const rawStatus = result.status.toLowerCase();
          let mappedStatus = order.status;

          if (["pending"].includes(rawStatus)) mappedStatus = "PENDING";
          else if (["processing", "in progress", "in_progress"].includes(rawStatus)) mappedStatus = "PROCESSING";
          else if (["completed", "success", "finished"].includes(rawStatus)) mappedStatus = "COMPLETED";
          else if (["partial"].includes(rawStatus)) mappedStatus = "PARTIAL";
          else if (["cancelled", "canceled", "failed"].includes(rawStatus)) mappedStatus = "CANCELLED";

          if (mappedStatus !== order.status) {
            updateDoc(doc(db, "traffic_orders", order.id), {
              status: mappedStatus,
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [db, apiSettings, history, isSyncing]);

  useEffect(() => {
    const interval = setInterval(syncStatus, 60000);
    syncStatus();
    return () => clearInterval(interval);
  }, [syncStatus]);

  const handleOrder = async () => {
    if (!db || !user?.uid || !profile) return
    
    if (!apiSettings || !apiSettings.apiUrl || !apiSettings.apiKey) {
      toast({ variant: "destructive", title: "Pesan Error", description: "Gagal memuat pengaturan API. Refresh halaman." });
      return;
    }

    if (!url || url.trim().length < 5) {
      toast({ variant: "destructive", title: "Input Salah", description: "Masukkan link Facebook yang valid." });
      return;
    }

    if (quantity < 1000) {
      toast({ variant: "destructive", title: "Minimal Pesanan", description: "Minimal pesanan adalah 1.000 trafik." });
      return;
    }
    
    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Saldo Koin Kurang", description: `Dibutuhkan ${coinCost} koin. Saldo Anda: ${profile.coins}` });
      return;
    }

    setIsOrdering(true);

    try {
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey,
        serviceId: serviceConfig.id,
        link: url.trim(),
        quantity: quantity
      });

      if (!apiResult.success) throw new Error(apiResult.error || "Gagal membuat pesanan.");

      await addDoc(collection(db, "traffic_orders"), {
        userId: user.uid,
        userEmail: user.email,
        platform: "facebook",
        serviceLabel: serviceConfig.label,
        targetLink: url.trim(),
        quantity: quantity,
        coinCost,
        status: "PENDING",
        providerOrderId: apiResult.orderId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(profileRef!, { coins: increment(-coinCost) });
      
      toast({ title: "Pesanan Berhasil! 🚀", description: "Trafik Facebook sedang dikirim." });
      setUrl("");
      setTimeout(syncStatus, 1500);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Memproses", description: err.message });
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-headline font-bold text-white flex items-center gap-3">
             <Facebook className="text-blue-500 h-8 w-8" /> Trafik FB 🚀
          </h2>
          <p className="text-muted-foreground text-sm">Tingkatkan tayangan postingan atau video Facebook Anda.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => syncStatus()} disabled={isSyncing} className="text-[10px] font-black uppercase text-primary">
          {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
          Update Status
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="premium-card rounded-2xl border-white/5 bg-black/40 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Booster Facebook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/70">Link Postingan/Video FB</Label>
                <Input 
                  placeholder="https://facebook.com/..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 h-11 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-xs font-bold text-white/70">Jumlah Trafik</Label>
                    <Input 
                      type="number" 
                      value={quantity}
                      step="1000"
                      min="1000"
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 h-11 rounded-xl text-sm"
                    />
                 </div>
                 <div className="bg-primary/10 border border-primary/20 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-primary/70">Biaya</span>
                    <span className="text-lg font-headline font-black text-primary">{coinCost} Koin 🪙</span>
                 </div>
              </div>
              <Button 
                onClick={handleOrder}
                disabled={isOrdering || !url || settingsLoading}
                className="w-full h-12 rounded-xl luxury-gradient font-bold text-sm shadow-xl"
              >
                {isOrdering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Mulai Booster FB"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="premium-card rounded-2xl border-white/5 bg-black/40 lg:col-span-4 h-fit">
          <CardHeader className="py-4 border-b border-white/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Panduan & Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs space-y-3 text-muted-foreground leading-relaxed">
            <p>• Gunakan link postingan publik yang valid.</p>
            <p>• Tarif: <strong>1.000 Trafik = 1 Koin</strong>.</p>
            <p>• Status disinkronkan otomatis dari provider.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-headline font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Riwayat 3 Hari Terakhir
        </h3>
        
        <Card className="premium-card rounded-2xl border-white/5 overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5">
                  <TableHead className="text-white text-xs font-bold py-4">Tautan Target</TableHead>
                  <TableHead className="text-white text-xs font-bold">Jumlah</TableHead>
                  <TableHead className="text-white text-xs font-bold">Biaya</TableHead>
                  <TableHead className="text-white text-xs font-bold">Status</TableHead>
                  <TableHead className="text-white text-xs font-bold text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground"><Loader2 className="animate-spin mx-auto h-5 w-5" /></TableCell></TableRow>
                ) : history.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground italic">Belum ada riwayat pesanan.</TableCell></TableRow>
                ) : (
                  history.map((row: any) => (
                    <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground font-mono">
                        <a href={row.targetLink} target="_blank" className="hover:text-primary transition-colors flex items-center gap-1.5">
                          <ExternalLink className="h-3 w-3 shrink-0" /> {row.targetLink}
                        </a>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-white">{(row.quantity || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-primary font-bold text-xs">{row.coinCost} 🪙</TableCell>
                      <TableCell>
                        <Badge className={cn(
                            "font-black text-[9px] px-2 py-0.5 uppercase",
                            ["COMPLETED", "SUCCESS"].includes(row.status?.toUpperCase()) ? "bg-green-500" : 
                            ["PROCESSING"].includes(row.status?.toUpperCase()) ? "bg-blue-600 animate-pulse" :
                            ["PARTIAL"].includes(row.status?.toUpperCase()) ? "bg-orange-500" :
                            ["CANCELLED", "FAILED"].includes(row.status?.toUpperCase()) ? "bg-red-500" : "bg-amber-500"
                        )}>{row.status || "PENDING"}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground">
                         {row.createdAt?.toDate?.().toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
