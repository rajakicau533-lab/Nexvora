"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Clock, ExternalLink, Loader2, Info, RefreshCw, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, updateDoc, increment, serverTimestamp, query, where, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder, checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"
import { TRAFFIC_SERVICES } from "@/lib/constants"

export default function ShopeeTrafficPage() {
  const [url, setUrl] = useState("")
  const [views, setViews] = useState(1000)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<"idle" | "processing" | "success" | "error">("idle")
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const serviceConfig = TRAFFIC_SERVICES.SHOPEE_VIEW
  const coinCost = Math.ceil(views / serviceConfig.rate_view_per_coin)

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
      where("userId", "==", user.uid)
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
        return createdAt >= threeDaysAgo && order.platform === 'shopee' && (order.serviceLabel === serviceConfig.label || !order.serviceLabel)
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0
        return timeB - timeA
      })
  }, [allHistory, serviceConfig.label])

  const syncStatus = useCallback(async () => {
    if (!db || !apiSettings || !history || history.length === 0 || isSyncing) return;
    
    const activeOrders = history.filter(o => ["PENDING", "PROCESSING", "Pending", "Processing"].includes(o.status));
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
          let mappedStatus = "PENDING";

          if (["processing", "in progress", "in_progress"].includes(rawStatus)) mappedStatus = "PROCESSING";
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
    
    // Ensure basic settings are loaded
    if (!apiSettings || !apiSettings.apiUrl || !apiSettings.apiKey) {
      toast({ 
        variant: "destructive", 
        title: "Pesan Error", 
        description: "Gagal memuat pengaturan API. Mohon tunggu sejenak atau refresh halaman." 
      });
      return;
    }

    if (!url || url.trim().length < 5) {
      toast({ variant: "destructive", title: "Input Salah", description: "Masukkan link produk Shopee yang valid." });
      return;
    }

    if (views < 1000) {
      toast({ variant: "destructive", title: "Minimal Pesanan", description: "Minimal pesanan adalah 1.000 views." });
      return;
    }
    
    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Saldo Koin Kurang", description: `Dibutuhkan ${coinCost} koin. Saldo Anda: ${profile.coins}` });
      return;
    }

    setIsOrdering(true);
    setOrderFeedback("processing");

    try {
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey,
        serviceId: serviceConfig.id,
        link: url.trim(),
        quantity: views
      });

      // Technical logging for auditing
      await addDoc(collection(db, "api_logs"), {
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        provider: "SMM.ID",
        link: url.trim(),
        quantity: views,
        serviceId: serviceConfig.id,
        status: apiResult.success ? "success" : "failed",
        responseBody: apiResult.rawResponse ? (typeof apiResult.rawResponse === 'object' ? JSON.stringify(apiResult.rawResponse) : apiResult.rawResponse) : "No Response Content",
        errorMessage: apiResult.error || null
      });

      if (!apiResult.success) {
        // Show raw error from provider
        throw new Error(apiResult.error || "Gagal membuat pesanan di server provider.");
      }

      // Record Order in Firestore
      await addDoc(collection(db, "traffic_orders"), {
        userId: user.uid,
        platform: "shopee",
        serviceLabel: serviceConfig.label,
        targetLink: url.trim(),
        quantity: views,
        coinCost,
        status: "PENDING",
        providerOrderId: apiResult.orderId,
        createdAt: serverTimestamp(),
      });

      // Deduct coins only on success
      await updateDoc(profileRef!, { 
        coins: increment(-coinCost) 
      });
      
      toast({ title: "Pesanan Berhasil! 🚀", description: "Trafik sedang dikirim ke target Anda." });
      setUrl("");
      setOrderFeedback("success");
      setTimeout(() => setOrderFeedback("idle"), 3000);
      setTimeout(syncStatus, 1000);
    } catch (err: any) {
      setOrderFeedback("error");
      toast({ variant: "destructive", title: "Gagal Memproses", description: err.message });
      setTimeout(() => setOrderFeedback("idle"), 3000);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-headline font-bold text-white">Trafik Shopee 🚀</h2>
          <p className="text-muted-foreground text-sm">Tingkatkan engagement produk atau video Shopee Anda.</p>
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
              <CardTitle className="text-lg">Order Booster Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/70">Link Produk/Video Shopee</Label>
                <Input 
                  placeholder="Contoh: https://shopee.co.id/product/..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 h-11 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-xs font-bold text-white/70">Jumlah Views</Label>
                    <Input 
                      type="number" 
                      value={views}
                      step="1000"
                      min="1000"
                      onChange={(e) => setViews(parseInt(e.target.value) || 0)}
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
                {isOrdering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {orderFeedback === 'success' ? "Berhasil Dipesan!" : isOrdering ? "Menghubungkan..." : "Mulai Booster Sekarang"}
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
            <p>• Gunakan link produk publik yang valid.</p>
            <p>• Tarif: <strong>1.000 Views = 1 Koin</strong>.</p>
            <p>• Hubungi Admin jika booster gagal dikirim.</p>
            <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
               <div className="flex items-center gap-2 text-amber-500 mb-1">
                 <AlertTriangle className="h-3 w-3" />
                 <span className="text-[10px] font-black uppercase">Penting</span>
               </div>
               <p className="text-[10px]">Jangan menggunakan link dari menu 'Flash Sale' karena struktur tautannya sering berubah.</p>
            </div>
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
                  <TableHead className="text-white text-xs font-bold py-4">Target Link</TableHead>
                  <TableHead className="text-white text-xs font-bold">Views</TableHead>
                  <TableHead className="text-white text-xs font-bold">Biaya</TableHead>
                  <TableHead className="text-white text-xs font-bold">Status</TableHead>
                  <TableHead className="text-white text-xs font-bold text-right">Provider ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">Memuat data...</TableCell></TableRow>
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
                      <TableCell className="font-bold text-xs">{(row.quantity || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-primary font-bold text-xs">{row.coinCost} 🪙</TableCell>
                      <TableCell>
                        <Badge className={cn(
                            "font-black text-[9px] px-2 py-0.5 uppercase",
                            row.status === "COMPLETED" ? "bg-green-500" : 
                            row.status === "PROCESSING" ? "bg-blue-600 animate-pulse" :
                            row.status === "CANCELLED" || row.status === "FAILED" ? "bg-red-500" : "bg-amber-500"
                        )}>{row.status || "PENDING"}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground font-mono">
                        {row.providerOrderId || "-"}
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