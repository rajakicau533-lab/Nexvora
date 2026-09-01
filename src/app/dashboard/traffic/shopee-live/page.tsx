"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Clock, ExternalLink, Loader2, Info, AlertCircle, RefreshCw, Send, History, Video, Minus, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, updateDoc, increment, serverTimestamp, query, where, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder, checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"
import { TRAFFIC_SERVICES } from "@/lib/constants"

export default function ShopeeLiveTrafficPage() {
  const [url, setUrl] = useState("")
  const [selectedDurationIdx, setSelectedDurationIdx] = useState(0)
  const [quantity, setQuantity] = useState(10)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const serviceConfig = TRAFFIC_SERVICES.SHOPEE_LIVE
  const currentDuration = serviceConfig.durations[selectedDurationIdx]
  
  // Perhitungan: (jumlah_view / 10) × harga_per_10_view
  const coinCost = Math.ceil((quantity / 10) * currentDuration.price_per_10)
  const isValidQuantity = quantity >= 10 && quantity % 10 === 0

  const apiSettingsRef = useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const historyQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "traffic_orders"), 
      where("userId", "==", user.uid),
      where("serviceLabel", "==", serviceConfig.label)
    )
  }, [db, user?.uid, serviceConfig.label])
  
  const { data: allHistory, loading: historyLoading } = useCollection<any>(historyQuery)

  const history = useMemo(() => {
    if (!allHistory) return []
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    return [...allHistory]
      .filter(o => (o.createdAt?.toDate?.() || new Date()) >= threeDaysAgo)
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
      });
  }, [allHistory]);

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
    if (!db || !user?.uid || !profile) return;
    if (!url) { toast({ variant: "destructive", title: "Link Wajib", description: "Silakan masukkan link Shopee Live terlebih dahulu." }); return; }
    if (!isValidQuantity) { toast({ variant: "destructive", title: "Jumlah Salah", description: "Jumlah view harus dalam kelipatan 10." }); return; }
    if (profile.coins < coinCost) { toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${coinCost} koin. Saldo: ${profile.coins}` }); return; }

    setIsOrdering(true);
    try {
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings?.apiUrl || "https://smm.id/api/v2",
        apiKey: apiSettings?.apiKey || "",
        serviceId: currentDuration.id,
        link: url.trim(),
        quantity: quantity
      });

      if (!apiResult.success) throw new Error(apiResult.error);

      await addDoc(collection(db, "traffic_orders"), {
        userId: user.uid,
        userEmail: user.email,
        platform: "shopee",
        serviceLabel: serviceConfig.label,
        targetLink: url.trim(),
        duration: currentDuration.label,
        quantity,
        coinCost,
        status: "PENDING",
        providerOrderId: apiResult.orderId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(profileRef!, { coins: increment(-coinCost) });
      toast({ title: "Pesanan Sukses! 🚀", description: "Trafik Shopee Live sedang diproses." });
      setUrl("");
      setTimeout(syncStatus, 1500);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
            <Video className="text-primary h-8 w-8" /> Trafik Live 🔴
          </h2>
          <p className="text-muted-foreground text-sm">Tingkatkan interaksi penonton pada sesi Shopee Live Anda secara instan.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => syncStatus()} disabled={isSyncing} className="text-[10px] font-black uppercase text-primary">
          {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
          Update Status
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 shadow-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
               <CardTitle className="text-xl text-white">Order Penonton Live</CardTitle>
               <CardDescription>Minimal 10 View. Kelipatan 10.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6 space-y-8">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Link Shopee Live</Label>
                <Input 
                  placeholder="Masukkan link Shopee Live..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-sm focus:border-primary/50"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Durasi Live</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {serviceConfig.durations.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDurationIdx(i)}
                      className={cn(
                        "p-4 rounded-xl border text-center transition-all group",
                        selectedDurationIdx === i 
                          ? "bg-primary/10 border-primary text-white shadow-lg shadow-primary/10" 
                          : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                      )}
                    >
                      <p className="text-sm font-bold">{d.label}</p>
                      <p className={cn(
                        "text-[10px] font-black uppercase mt-1",
                        selectedDurationIdx === i ? "text-primary" : "text-white/20"
                      )}>{d.price_per_10} Koin / 10v</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Jumlah View</Label>
                  <div className="flex items-center gap-4">
                     <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setQuantity(Math.max(10, quantity - 10))}
                      className="rounded-xl border-white/10 h-12 w-12"
                     >
                       <Minus className="h-4 w-4" />
                     </Button>
                     <Input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="bg-white/5 border-white/10 h-12 text-center text-lg font-bold rounded-xl"
                     />
                     <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setQuantity(quantity + 10)}
                      className="rounded-xl border-white/10 h-12 w-12"
                     >
                       <Plus className="h-4 w-4" />
                     </Button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-center items-center text-center">
                   <p className="text-[10px] font-black uppercase text-primary/70 tracking-[0.2em] mb-1">Total Koin</p>
                   <p className="text-3xl font-headline font-black text-primary">{coinCost} <span className="text-sm">🪙</span></p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                 <Info className="h-5 w-5 text-primary shrink-0" />
                 <p className="text-xs font-bold text-white/60">Estimasi masuk 25 menit</p>
              </div>

              <Button 
                onClick={handleOrder}
                disabled={isOrdering || !url || !isValidQuantity}
                className="w-full h-16 rounded-2xl luxury-gradient font-black text-lg shadow-xl shadow-primary/20 group"
              >
                {isOrdering ? <Loader2 className="animate-spin h-6 w-6" /> : <><Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /> MULAI TRAFIK LIVE</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5 bg-black/40 h-fit">
            <CardHeader className="py-5 border-b border-white/5">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                <Info className="h-4 w-4" /> RINGKASAN ORDER
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Durasi</span>
                    <span className="text-white font-bold">{currentDuration.label}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Jumlah View</span>
                    <span className="text-white font-bold">{quantity} View</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="text-white font-bold">{currentDuration.price_per_10} Koin / 10v</span>
                 </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center">
                    <span className="font-bold text-white uppercase text-xs">Total Biaya</span>
                    <span className="text-xl font-headline font-black text-primary">{coinCost} 🪙</span>
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
                 <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] leading-snug text-amber-500/80">Pastikan link live sudah aktif sebelum melakukan order untuk menghindari kegagalan sistem.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-headline font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Riwayat Trafik Live
        </h3>
        <Card className="premium-card rounded-[2rem] border-white/5 overflow-hidden bg-black/40">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-white text-[10px] font-black uppercase py-4">Waktu</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">Tautan Live</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">Durasi</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">View</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
              ) : history?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground italic">Belum ada riwayat pesanan.</TableCell></TableRow>
              ) : (
                history.map((row: any) => (
                  <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-[10px] font-bold text-white/60">
                      {row.createdAt?.toDate?.().toLocaleString() || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-[11px] font-mono text-muted-foreground">
                      <a href={row.targetLink} target="_blank" className="hover:text-primary transition-colors flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 shrink-0" /> {row.targetLink}
                      </a>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-white">{row.duration || "-"}</TableCell>
                    <TableCell className="font-bold text-white text-xs">{(row.quantity || 0).toLocaleString()} 👥</TableCell>
                    <TableCell>
                      <Badge className={cn(
                          "font-black text-[9px] px-2 py-0.5 uppercase border-none",
                          ["COMPLETED", "SUCCESS"].includes(row.status?.toUpperCase()) ? "bg-green-500" : 
                          ["PROCESSING"].includes(row.status?.toUpperCase()) ? "bg-blue-600 animate-pulse" :
                          ["PARTIAL"].includes(row.status?.toUpperCase()) ? "bg-orange-500" :
                          ["CANCELLED", "FAILED"].includes(row.status?.toUpperCase()) ? "bg-red-500" : "bg-amber-500"
                      )}>{row.status || "PENDING"}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
