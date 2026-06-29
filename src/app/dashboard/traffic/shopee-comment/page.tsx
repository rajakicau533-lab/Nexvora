"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, ExternalLink, Loader2, Info, AlertCircle, RefreshCw, MessageSquare, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, updateDoc, increment, serverTimestamp, query, where, addDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder, checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"
import { TRAFFIC_SERVICES } from "@/lib/constants"

const TEMPLATE_COMMENTS = [
  "Wah bagus banget aku dah co",
  "Keren banget produknya",
  "Pengiriman cepat dan aman",
  "Sesuai deskripsi seller",
  "Harga murah kualitas mantap",
  "Baru datang langsung dipakai",
  "Recommended banget pokoknya",
  "Packing rapi dan aman",
  "Terima kasih seller",
  "Bintang lima untuk produk ini"
];

export default function ShopeeCommentPage() {
  const [url, setUrl] = useState("")
  const [commentsText, setCommentsText] = useState("")
  const [isOrdering, setIsOrdering] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<"idle" | "processing" | "success" | "error">("idle")
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const serviceConfig = TRAFFIC_SERVICES.SHOPEE_COMMENT
  
  // Count non-empty lines
  const commentsArray = commentsText.split('\n').map(c => c.trim()).filter(c => c.length > 0);
  const quantity = commentsArray.length;
  const coinCost = quantity * serviceConfig.rate_per_comment;
  const isValidQuantity = quantity >= 3;

  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const historyQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "traffic_orders"), 
      where("userId", "==", user.uid),
      where("serviceLabel", "==", serviceConfig.label)
    )
  }, [db, user?.uid, serviceConfig.label])

  const { data: allHistory, loading: historyLoading } = useCollection<any>(historyQuery)

  const history = React.useMemo(() => {
    if (!allHistory) return []
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    return [...allHistory]
      .filter(order => (order.createdAt?.toDate?.() || new Date()) >= threeDaysAgo)
      .sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0))
  }, [allHistory])

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

  const handleUseTemplate = () => {
    setCommentsText(TEMPLATE_COMMENTS.join('\n'));
    toast({ title: "Template Digunakan", description: "10 komentar contoh telah diisi." });
  }

  const handleOrder = async () => {
    if (!db || !user?.uid || !profile) return
    if (!url) {
      toast({ variant: "destructive", title: "Link Wajib", description: "Masukkan link produk/video Shopee." });
      return;
    }
    if (!isValidQuantity) {
      toast({ variant: "destructive", title: "Minimal Order", description: "Minimal order adalah 3 komentar." });
      return;
    }
    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${coinCost} koin untuk order ini.` });
      return;
    }

    setIsOrdering(true);
    setOrderFeedback("processing");

    try {
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings?.apiUrl || "",
        apiKey: apiSettings?.apiKey || "",
        serviceId: serviceConfig.id,
        link: url,
        quantity: quantity,
        comments: commentsText.trim()
      });

      // technical auditing log
      await addDoc(collection(db, "api_logs"), {
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        provider: "SMM.ID",
        link: url,
        quantity: quantity,
        serviceId: serviceConfig.id,
        status: apiResult.success ? "success" : "failed",
        responseBody: apiResult.rawResponse ? (typeof apiResult.rawResponse === 'object' ? JSON.stringify(apiResult.rawResponse) : apiResult.rawResponse) : "No Response Content",
        errorMessage: apiResult.error || null
      });

      if (!apiResult.success) throw new Error(apiResult.error);

      // RECORD ORDER
      await addDoc(collection(db, "traffic_orders"), {
        userId: user.uid,
        platform: "shopee",
        serviceLabel: serviceConfig.label,
        targetLink: url,
        quantity: quantity,
        coinCost,
        status: "PENDING",
        providerOrderId: apiResult.orderId,
        createdAt: serverTimestamp(),
      });

      // DEDUCT COINS
      await updateDoc(profileRef!, { coins: increment(-coinCost) });
      
      toast({ title: "Sukses!", description: "Pesanan komentar Shopee sedang diproses." });
      setUrl("");
      setCommentsText("");
      setOrderFeedback("success");
      setTimeout(() => setOrderFeedback("idle"), 3000);
      setTimeout(syncStatus, 2000);
    } catch (err: any) {
      setOrderFeedback("error");
      toast({ variant: "destructive", title: "Gagal", description: err.message });
      setTimeout(() => setOrderFeedback("idle"), 3000);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-10">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-headline font-bold text-white">Shopee Comment 💬</h2>
          <p className="text-muted-foreground text-sm">Berikan testimoni atau komentar kustom pada produk/video Shopee Anda.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => syncStatus()} disabled={isSyncing} className="text-[10px] font-black uppercase text-primary">
          {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
          Sync Status
        </Button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="premium-card rounded-2xl border-white/5 bg-black/40 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Komentar Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/70">Link Produk/Video Shopee</Label>
                <Input 
                  placeholder="https://shopee.co.id/product/..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 h-11 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-white/70">Daftar Komentar (1 Baris = 1 Komentar)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUseTemplate}
                    className="h-7 text-[10px] font-bold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 rounded-lg"
                  >
                    <FileText className="h-3 w-3 mr-1.5" /> Gunakan Template
                  </Button>
                </div>
                <Textarea 
                  placeholder={"Wah bagus banget aku dah co\nKeren banget produknya\nPengiriman cepat dan aman"} 
                  value={commentsText}
                  onChange={(e) => setCommentsText(e.target.value)}
                  className="bg-white/5 border-white/10 min-h-[200px] rounded-xl text-sm focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Jumlah Komentar</p>
                    <div className="flex items-center gap-2">
                       <span className={cn("text-xl font-headline font-black", isValidQuantity ? "text-white" : "text-red-500")}>
                         {quantity}
                       </span>
                       <span className="text-[10px] font-bold text-white/30 uppercase">Baris</span>
                    </div>
                    {!isValidQuantity && quantity > 0 && (
                       <p className="text-[9px] text-red-500 flex items-center gap-1 mt-1 font-bold">
                         <AlertCircle className="h-2.5 w-2.5" /> Minimal order 3 komentar
                       </p>
                    )}
                 </div>
                 <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-primary/70 mb-1">Biaya Koin</p>
                    <div className="flex items-center gap-2">
                       <span className="text-xl font-headline font-black text-primary">{coinCost}</span>
                       <span className="text-[10px] font-bold text-primary/50 uppercase">Koin 🪙</span>
                    </div>
                 </div>
              </div>

              <Button 
                onClick={handleOrder}
                disabled={isOrdering || !url || !isValidQuantity}
                className="w-full h-14 rounded-xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group"
              >
                {isOrdering ? (
                   <div className="flex items-center gap-3">
                     <Loader2 className="h-5 w-5 animate-spin" />
                     <span>Memproses...</span>
                   </div>
                ) : (
                  <>
                    {orderFeedback === 'success' ? "Pesanan Dibuat!" : "Pesan Komentar Sekarang"} 
                    <MessageSquare className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="premium-card rounded-2xl border-white/5 bg-black/40 lg:col-span-4 h-fit">
          <CardHeader className="py-4 border-b border-white/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <Info className="h-4 w-4 text-primary" /> Panduan & Harga
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs space-y-4 text-muted-foreground leading-relaxed">
            <div className="space-y-2">
               <p className="font-bold text-white/80 uppercase text-[9px] tracking-widest">Informasi Layanan:</p>
               <ul className="space-y-2">
                  <li className="flex items-start gap-2">• Minimal order: <strong>3 komentar</strong>.</li>
                  <li className="flex items-start gap-2">• Tarif: <strong>1 Komentar = 1 Koin</strong>.</li>
                  <li className="flex items-start gap-2">• Gunakan enter untuk memisahkan komentar.</li>
                  <li className="flex items-start gap-2">• Link harus bersifat publik / tidak privat.</li>
               </ul>
            </div>
            
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
               <div className="flex items-center gap-2 text-primary mb-1">
                 <AlertCircle className="h-3 w-3" />
                 <span className="text-[9px] font-black uppercase">Tips Optimasi</span>
               </div>
               <p className="text-[10px]">Gunakan template jika Anda ingin komentar natural untuk meningkatkan rasa percaya pembeli pada produk affiliate Anda.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-headline font-bold flex items-center gap-2 text-white">
          <Clock className="h-5 w-5 text-primary" /> Riwayat Shopee Comment
        </h3>
        
        <Card className="premium-card rounded-2xl border-white/5 overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5">
                  <TableHead className="text-white text-xs font-bold py-4 uppercase">Target Link</TableHead>
                  <TableHead className="text-white text-xs font-bold uppercase">Jumlah</TableHead>
                  <TableHead className="text-white text-xs font-bold uppercase">Biaya</TableHead>
                  <TableHead className="text-white text-xs font-bold uppercase">Status</TableHead>
                  <TableHead className="text-white text-xs font-bold text-right uppercase">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground"><Loader2 className="animate-spin mx-auto h-5 w-5 text-primary" /></TableCell></TableRow>
                ) : history.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground italic">Belum ada riwayat Shopee Comment.</TableCell></TableRow>
                ) : (
                  history.map((row: any) => (
                    <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-mono">
                        <a href={row.targetLink} target="_blank" className="hover:text-primary transition-colors flex items-center gap-1.5">
                          <ExternalLink className="h-3 w-3 shrink-0" /> {row.targetLink}
                        </a>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-white">{(row.quantity || 0).toLocaleString()} Komentar</TableCell>
                      <TableCell className="text-primary font-bold text-xs">{row.coinCost} 🪙</TableCell>
                      <TableCell>
                        <Badge className={cn(
                            "font-black text-[9px] px-2 py-0.5 uppercase border-none",
                            row.status === "COMPLETED" ? "bg-green-500" : 
                            row.status === "PROCESSING" ? "bg-blue-600 animate-pulse" :
                            row.status === "CANCELLED" || row.status === "FAILED" ? "bg-red-500" : "bg-amber-500"
                        )}>{row.status || "PENDING"}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground font-bold uppercase">
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
