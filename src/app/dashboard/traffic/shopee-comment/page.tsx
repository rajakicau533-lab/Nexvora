
"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, ExternalLink, Loader2, Info, AlertCircle, RefreshCw, MessageSquare, FileText, Send, Calendar as CalendarIcon, History } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, updateDoc, increment, serverTimestamp, query, where, addDoc, Timestamp, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder } from "@/ai/flows/process-traffic-order-flow"
import { TRAFFIC_SERVICES } from "@/lib/constants"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createScheduledComment } from "@/lib/scheduled-comment-service"

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

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export default function ShopeeCommentPage() {
  const [url, setUrl] = useState("")
  const [commentsText, setCommentsText] = useState("")
  const [isOrdering, setIsOrdering] = useState(false)
  
  // Scheduling States
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState("12");
  const [scheduleMinute, setScheduleMinute] = useState("00");

  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const serviceConfig = TRAFFIC_SERVICES.SHOPEE_COMMENT
  
  // Count non-empty lines accurately for quantity
  const commentsArray = useMemo(() => {
    return commentsText
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }, [commentsText]);

  const quantity = commentsArray.length;
  const coinCost = quantity * (serviceConfig.rate_per_comment || 1);
  
  // Service 4239 in provider supports Min 1 and Max 100
  const isValidQuantity = quantity >= 1 && quantity <= 100;
  const finalCommentsPayload = useMemo(() => commentsArray.join('\n'), [commentsArray]);

  // Stable References
  const apiSettingsRef = useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  const profileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // History Queries
  const directQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "traffic_orders"), 
      where("userId", "==", user.uid),
      where("serviceLabel", "==", serviceConfig.label),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid, serviceConfig.label])
  const { data: directHistory, loading: directLoading } = useCollection<any>(directQuery)

  const scheduledQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "scheduled_comments"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])
  const { data: scheduledHistory, loading: scheduledLoading } = useCollection<any>(scheduledQuery)

  const handleUseTemplate = () => {
    setCommentsText(TEMPLATE_COMMENTS.join('\n'));
    toast({ title: "Template Digunakan", description: "Contoh komentar telah diisi." });
  }

  const handleDirectOrder = async () => {
    if (!db || !user?.uid || !profile) return;
    if (!url) { toast({ variant: "destructive", title: "Link Wajib", description: "Masukkan link produk/video." }); return; }
    
    if (quantity < 1) { 
      toast({ variant: "destructive", title: "Minimal Order", description: "Masukkan minimal 1 baris komentar." }); 
      return; 
    }
    if (quantity > 100) {
      toast({ variant: "destructive", title: "Maksimal Order", description: "Maksimal adalah 100 komentar per pesanan." });
      return;
    }

    if (profile.coins < coinCost) { 
      toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${coinCost} koin. Saldo Anda: ${profile.coins}` }); 
      return; 
    }

    setIsOrdering(true);
    try {
      // Use forced Service ID 4239 to avoid conflicts with global Shopee View settings
      const activeServiceId = serviceConfig.id; 
      
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings?.apiUrl || "https://smm.id/api/v2",
        apiKey: apiSettings?.apiKey || "",
        serviceId: activeServiceId,
        link: url.trim(),
        quantity: quantity,
        comments: finalCommentsPayload
      });

      // Audit Log for technical tracing
      await addDoc(collection(db, "api_logs"), {
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        provider: "SMM.ID",
        link: url.trim(),
        quantity: quantity,
        serviceId: activeServiceId,
        status: apiResult.success ? "success" : "failed",
        errorMessage: apiResult.error || null,
        rawResponse: apiResult.rawResponse ? (typeof apiResult.rawResponse === 'object' ? JSON.stringify(apiResult.rawResponse) : apiResult.rawResponse) : "No Response"
      });

      if (!apiResult.success) throw new Error(apiResult.error);

      await addDoc(collection(db, "traffic_orders"), {
        userId: user.uid,
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
      toast({ title: "Sukses!", description: "Pesanan komentar sedang diproses." });
      setUrl(""); setCommentsText("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsOrdering(false);
    }
  };

  const handleScheduleOrder = async () => {
    if (!db || !user?.uid || !profile) return;
    if (!url || quantity < 1 || !scheduleDate) {
      toast({ variant: "destructive", title: "Input Belum Lengkap", description: "Pastikan link, komentar (min 1), dan tanggal sudah diisi." });
      return;
    }

    if (quantity > 100) {
      toast({ variant: "destructive", title: "Maksimal Order", description: "Maksimal adalah 100 komentar." });
      return;
    }

    const scheduledDate = new Date(`${scheduleDate}T${scheduleHour}:${scheduleMinute}:00`);
    if (scheduledDate <= new Date()) {
      toast({ variant: "destructive", title: "Waktu Tidak Valid", description: "Pilih waktu di masa depan." });
      return;
    }

    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Koin Kurang", description: "Saldo koin tidak cukup." });
      return;
    }

    setIsOrdering(true);
    try {
      const activeServiceId = serviceConfig.id;

      await createScheduledComment(db, {
        userId: user.uid,
        userEmail: user.email,
        videoLink: url.trim(),
        commentText: finalCommentsPayload,
        quantity: quantity,
        coinUsed: coinCost,
        serviceId: activeServiceId,
        scheduledAt: Timestamp.fromDate(scheduledDate)
      });

      toast({ title: "Jadwal Dibuat!", description: `Order akan dikirim otomatis pada ${scheduledDate.toLocaleString()}.` });
      setUrl(""); setCommentsText(""); setScheduleDate("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Membuat Jadwal", description: err.message });
    } finally {
      setIsOrdering(false);
    }
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-headline font-bold text-white">Shopee Comment 💬</h2>
          <p className="text-muted-foreground text-sm">Tingkatkan interaksi video Shopee Anda dengan komentar kustom secara instan atau terjadwal.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-6 py-2.5 rounded-2xl text-primary font-bold shadow-lg shadow-primary/5">
          Saldo: {profile?.coins || 0} 🪙
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 shadow-2xl overflow-hidden">
            <Tabs defaultValue="direct" className="w-full">
              <TabsList className="w-full bg-white/5 rounded-none h-14 border-b border-white/5">
                <TabsTrigger value="direct" className="flex-1 font-bold gap-2"><Send className="h-4 w-4" /> Pesan Langsung</TabsTrigger>
                <TabsTrigger value="scheduled" className="flex-1 font-bold gap-2"><Clock className="h-4 w-4" /> Jadwalkan</TabsTrigger>
              </TabsList>
              
              <CardContent className="p-8 pt-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-white/40 tracking-widest ml-1">Link Video / Produk</Label>
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
                      <FileText className="h-3 w-3 mr-1.5" /> Gunakan Template
                    </Button>
                  </div>
                  <Textarea 
                    placeholder={"Bagus banget kakk\nAku udah checkout makasii\nSesuai deskripsi kakk"}
                    value={commentsText}
                    onChange={(e) => setCommentsText(e.target.value)}
                    className="bg-white/5 border-white/10 min-h-[160px] rounded-xl text-sm focus:border-primary/50"
                  />
                  <div className="flex justify-between text-[10px] font-black uppercase text-white/30 px-1">
                    <span className={cn(quantity > 100 ? "text-red-500 font-bold" : "text-white/30")}>
                      Terdeteksi: {quantity} Komentar {quantity > 100 && "(Max 100)"}
                    </span>
                    <span className="text-primary">Biaya: {coinCost} Koin</span>
                  </div>
                </div>

                <TabsContent value="direct" className="m-0 mt-6 animate-in fade-in slide-in-from-bottom-2">
                  <Button 
                    onClick={handleDirectOrder}
                    disabled={isOrdering || !url || quantity < 1 || quantity > 100}
                    className="w-full h-14 rounded-2xl luxury-gradient font-black text-lg shadow-xl shadow-primary/20"
                  >
                    {isOrdering ? <Loader2 className="animate-spin h-6 w-6" /> : "Kirim Sekarang 🚀"}
                  </Button>
                </TabsContent>

                <TabsContent value="scheduled" className="m-0 mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Tanggal</Label>
                         <Input 
                           type="date" 
                           value={scheduleDate}
                           onChange={(e) => setScheduleDate(e.target.value)}
                           className="bg-white/5 border-white/10 h-12 rounded-xl text-white"
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Jam</Label>
                         <select 
                           value={scheduleHour}
                           onChange={(e) => setScheduleHour(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 h-12 rounded-xl text-sm px-4 outline-none focus:border-primary/50"
                         >
                            {HOURS.map(h => <option key={h} value={h} className="bg-neutral-900">{h}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Menit</Label>
                         <select 
                           value={scheduleMinute}
                           onChange={(e) => setScheduleMinute(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 h-12 rounded-xl text-sm px-4 outline-none focus:border-primary/50"
                         >
                            {MINUTES.map(m => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
                         </select>
                      </div>
                   </div>
                   <Button 
                    onClick={handleScheduleOrder}
                    disabled={isOrdering || !url || quantity < 1 || quantity > 100 || !scheduleDate}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-lg transition-all"
                   >
                     {isOrdering ? <Loader2 className="animate-spin h-6 w-6" /> : "Buat Jadwal Antrian 🕒"}
                   </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5 bg-black/40 h-fit">
            <CardHeader className="py-5 border-b border-white/5">
              <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-primary">
                <Info className="h-4 w-4" /> Ketentuan Layanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-[11px] space-y-4 text-muted-foreground leading-relaxed">
              <div className="space-y-2">
                <p>• Minimal order: <strong>1 komentar</strong>.</p>
                <p>• Maksimal order: <strong>100 komentar</strong>.</p>
                <p>• Tarif: <strong>1 Komentar = 1 Koin</strong>.</p>
                <p>• Tulis komentar Anda per baris.</p>
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                 <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                 <p className="text-[10px] leading-snug">Pastikan target video bersifat publik. Untuk mode terjadwal, koin dipotong saat jadwal dibuat dan di-refund otomatis jika gagal eksekusi.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-10 pt-4">
        {/* Scheduled History */}
        <div className="space-y-4">
           <h3 className="text-lg font-headline font-bold text-white flex items-center gap-2 uppercase tracking-tight">
             <Clock className="h-5 w-5 text-primary" /> Riwayat Antrean Terjadwal
           </h3>
           <Card className="premium-card rounded-[2rem] border-white/5 overflow-hidden bg-black/40">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-white text-[10px] font-black uppercase py-4">Waktu Jadwal</TableHead>
                    <TableHead className="text-white text-[10px] font-black uppercase">Target Video</TableHead>
                    <TableHead className="text-white text-[10px] font-black uppercase">Komentar</TableHead>
                    <TableHead className="text-white text-[10px] font-black uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
                  ) : scheduledHistory?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-xs text-muted-foreground italic">Belum ada antrean terjadwal.</TableCell></TableRow>
                  ) : (
                    scheduledHistory?.map((row: any) => (
                      <TableRow key={row.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell>
                           <p className="text-white font-bold text-xs">{row.scheduledAt?.toDate?.().toLocaleDateString() || "-"}</p>
                           <p className="text-[10px] text-primary font-black">{row.scheduledAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "-"}</p>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-[11px] font-mono text-muted-foreground">
                          <a href={row.videoLink} target="_blank" className="hover:text-primary transition-colors">{row.videoLink}</a>
                        </TableCell>
                        <TableCell className="text-white font-bold text-xs">{row.quantity} 💬</TableCell>
                        <TableCell>
                          <Badge className={cn(
                              "font-black text-[9px] px-2 py-0.5 uppercase border-none",
                              row.status === "completed" ? "bg-green-500" : 
                              row.status === "processing" ? "bg-blue-600 animate-pulse" :
                              row.status === "failed" ? "bg-red-500" : "bg-amber-500"
                          )}>
                            {row.status === "scheduled" ? "DIJADWALKAN" : row.status === "completed" ? "SELESAI" : row.status === "failed" ? "GAGAL" : row.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
           </Card>
        </div>

        {/* Direct History */}
        <div className="space-y-4">
          <h3 className="text-lg font-headline font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <History className="h-5 w-5 text-primary" /> Riwayat Pesanan Langsung
          </h3>
          <Card className="premium-card rounded-[2rem] border-white/5 overflow-hidden bg-black/40">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white text-[10px] font-black uppercase py-4">Waktu Order</TableHead>
                  <TableHead className="text-white text-[10px] font-black uppercase">Target Video</TableHead>
                  <TableHead className="text-white text-[10px] font-black uppercase">Jumlah</TableHead>
                  <TableHead className="text-white text-[10px] font-black uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
                ) : directHistory?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-xs text-muted-foreground italic">Belum ada riwayat pesanan langsung.</TableCell></TableRow>
                ) : (
                  directHistory?.map((row: any) => (
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
                            ["COMPLETED", "SELESAI", "success"].includes(row.status) ? "bg-green-500" : 
                            ["PROCESSING", "processing", "in progress"].includes(row.status) ? "bg-blue-600 animate-pulse" :
                            ["CANCELLED", "FAILED", "failed"].includes(row.status) ? "bg-red-500" : "bg-amber-500"
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
    </div>
  )
}
