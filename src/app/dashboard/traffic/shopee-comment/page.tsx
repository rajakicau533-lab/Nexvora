"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, ExternalLink, Loader2, Info, AlertCircle, RefreshCw, Send, History, FileText } from "lucide-react"
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

  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const serviceConfig = TRAFFIC_SERVICES.SHOPEE_COMMENT
  
  const commentsArray = useMemo(() => {
    return commentsText
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }, [commentsText]);

  const quantity = commentsArray.length;
  // Kalkulasi: 10 komentar = 5 koin (0.5 koin per komentar)
  const coinCost = Math.ceil(quantity * (serviceConfig.rate_per_comment || 0.5));
  const isValidQuantity = quantity >= 10 && quantity <= 500;
  const finalCommentsPayload = useMemo(() => commentsArray.join('\n'), [commentsArray]);

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

  const handleUseTemplate = () => {
    setCommentsText(TEMPLATE_COMMENTS.join('\n'));
    toast({ title: "Template Digunakan", description: "10 contoh komentar telah diisi." });
  }

  const handleOrder = async () => {
    if (!db || !user?.uid || !profile) return;
    if (!url) { toast({ variant: "destructive", title: "Link Wajib", description: "Masukkan link produk/video." }); return; }
    if (quantity < 10) { toast({ variant: "destructive", title: "Jumlah Salah", description: "Minimal order 10 komentar." }); return; }
    if (profile.coins < coinCost) { toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${coinCost} koin. Saldo: ${profile.coins}` }); return; }

    setIsOrdering(true);
    try {
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings?.apiUrl || "https://smm.id/api/v2",
        apiKey: apiSettings?.apiKey || "",
        serviceId: serviceConfig.id,
        link: url.trim(),
        quantity: quantity,
        comments: finalCommentsPayload
      });

      if (!apiResult.success) throw new Error(apiResult.error);

      await addDoc(collection(db, "traffic_orders"), {
        userId: user.uid,
        userEmail: user.email,
        platform: "shopee",
        serviceLabel: serviceConfig.label,
        targetLink: url.trim(),
        quantity,
        coinCost,
        status: "PENDING",
        providerOrderId: apiResult.orderId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(profileRef!, { coins: increment(-coinCost) });
      toast({ title: "Pesanan Sukses! 🚀", description: "Komentar sedang dalam proses pengiriman." });
      setUrl(""); setCommentsText("");
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
          <h2 className="text-3xl font-headline font-bold text-white">Shopee Comment 💬</h2>
          <p className="text-muted-foreground text-sm">Berikan komentar kustom pada video/produk Shopee Anda secara instan.</p>
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
               <CardTitle className="text-xl text-white">Order Komentar Baru</CardTitle>
               <CardDescription>Meningkatkan interaksi video Shopee dengan komentar natural.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Tautan Target</Label>
                <Input 
                  placeholder="https://shopee.co.id/..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Isi Komentar (1 Baris = 1 Komen)</Label>
                  <Button variant="outline" size="sm" onClick={handleUseTemplate} className="h-7 text-[10px] border-primary/20 bg-primary/5 text-primary">
                    <FileText className="h-3 w-3 mr-1.5" /> Pakai Template
                  </Button>
                </div>
                <Textarea 
                  placeholder={"Contoh:\nKeren banget kak produknya\nAku baru aja checkout nih\nRecommended seller banget"}
                  value={commentsText}
                  onChange={(e) => setCommentsText(e.target.value)}
                  className="bg-white/5 border-white/10 min-h-[160px] rounded-xl text-sm focus:border-primary/50"
                />
                <div className="flex justify-between text-[10px] font-black uppercase text-white/30 px-1">
                  <span className={cn(quantity < 10 && quantity > 0 ? "text-red-500 font-bold" : "text-white/30")}>
                    Terhitung: {quantity} Komentar {quantity < 10 && quantity > 0 && "(Minimal 10)"}
                  </span>
                  <span className="text-primary font-bold">Total Biaya: {coinCost} Koin</span>
                </div>
              </div>

              <Button 
                onClick={handleOrder}
                disabled={isOrdering || !url || !isValidQuantity}
                className="w-full h-14 rounded-2xl luxury-gradient font-black text-lg shadow-xl shadow-primary/20 group"
              >
                {isOrdering ? <Loader2 className="animate-spin h-6 w-6" /> : <><Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /> KIRIM PESANAN SEKARANG</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5 bg-black/40 h-fit">
            <CardHeader className="py-5 border-b border-white/5">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                <Info className="h-4 w-4" /> INFO LAYANAN
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-[11px] space-y-4 text-muted-foreground leading-relaxed">
              <div className="space-y-2">
                <p>• Tarif: <strong>10 Komentar = 5 Koin</strong>.</p>
                <p>• Minimal: <strong>10 komentar</strong> per order.</p>
                <p>• Status mengikuti integrasi realtime dengan provider.</p>
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                 <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                 <p className="text-[10px] leading-snug">Pastikan video atau produk tidak dalam mode privat agar akun bot kami bisa berkomentar.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-headline font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-primary" /> Riwayat Pesanan
        </h3>
        <Card className="premium-card rounded-[2rem] border-white/5 overflow-hidden bg-black/40">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-white text-[10px] font-black uppercase py-4">Waktu</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">Tautan Target</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">Jumlah</TableHead>
                <TableHead className="text-white text-[10px] font-black uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
              ) : history?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-xs text-muted-foreground italic">Belum ada riwayat pesanan.</TableCell></TableRow>
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
                    <TableCell className="font-bold text-white text-xs">{(row.quantity || 0).toLocaleString()} 💬</TableCell>
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
