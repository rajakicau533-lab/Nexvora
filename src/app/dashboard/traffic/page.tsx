"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingBag, Music, Info, Clock, ExternalLink, Loader2, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp, query, where, Timestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder } from "@/ai/flows/process-traffic-order-flow"

export default function TrafficServicePage() {
  const [url, setUrl] = useState("")
  const [views, setViews] = useState(1000)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderFeedback, setOrderFeedback] = useState<"idle" | "processing" | "success" | "error">("idle")
  
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const coinCost = Math.ceil(views / 1000)

  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings, loading: settingsLoading } = useDoc(apiSettingsRef)

  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const historyQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "traffic_orders"), 
      where("userId", "==", user.uid)
    )
  }, [db, user?.uid])

  const { data: allHistory, loading: historyLoading, error: historyError } = useCollection<any>(historyQuery)

  const history = React.useMemo(() => {
    if (!allHistory) return []
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    return [...allHistory]
      .filter(order => {
        const createdAt = order.createdAt?.toDate?.() || new Date()
        return createdAt >= threeDaysAgo
      })
      .sort((a, b) => {
        const timeA = a.createdAt?.toDate?.()?.getTime() || 0
        const timeB = b.createdAt?.toDate?.()?.getTime() || 0
        return timeB - timeA
      })
  }, [allHistory])

  useEffect(() => {
    if (!db || !history || history.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const pendingOrders = history.filter((order: any) => order.status === "PENDING");

      for (const order of pendingOrders) {
        if (!order.createdAt) continue;
        
        const createdAt = order.createdAt?.toDate?.() || 0;
        const diffInSeconds = (now - (typeof createdAt === 'object' ? createdAt.toDate().getTime() : createdAt)) / 1000;

        if (diffInSeconds >= 50) {
          updateDoc(doc(db, "traffic_orders", order.id), {
            status: "SELESAI",
            updatedAt: serverTimestamp()
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [db, history]);

  const validateUrl = (input: string, platform: "shopee" | "tiktok") => {
    try {
      const parsed = new URL(input.startsWith('http') ? input : `https://${input}`);
      const hostname = parsed.hostname.toLowerCase();
      if (platform === "shopee") {
        const domains = ['shopee.co.id', 'shp.ee', 'id.shp.ee', 's.shopee.co.id', 'vn.shp.ee', 'my.shp.ee'];
        return domains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
      }
      return hostname.includes('tiktok.com');
    } catch (e) { return false; }
  };

  const handleOrder = async (platform: "shopee" | "tiktok") => {
    if (!db || !user?.uid || !profile) return
    if (!url || !validateUrl(url, platform)) {
      toast({ variant: "destructive", title: "Link Tidak Valid", description: "Masukkan link Shopee/TikTok yang benar." });
      return;
    }
    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Koin Kurang", description: `Butuh ${coinCost} koin.` });
      return;
    }

    setIsOrdering(true);
    setOrderFeedback("processing");

    try {
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings?.apiUrl || "",
        apiKey: apiSettings?.apiKey || "",
        serviceId: apiSettings?.serviceId || "",
        link: url,
        quantity: views
      });

      if (!apiResult.success) throw new Error(apiResult.error);

      await setDoc(doc(collection(db, "traffic_orders")), {
        userId: user.uid,
        platform,
        targetLink: url,
        quantity: views,
        coinCost,
        status: "PENDING",
        createdAt: serverTimestamp(),
      });

      await updateDoc(profileRef!, { coins: increment(-coinCost) });
      
      toast({ title: "Sukses!", description: "Pesanan trafik sedang diproses." });
      setUrl("");
      setOrderFeedback("success");
      setTimeout(() => setOrderFeedback("idle"), 3000);
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
      <div className="space-y-1">
        <h2 className="text-2xl font-headline font-bold text-white">Booster Trafik 🚀</h2>
        <p className="text-muted-foreground text-sm">Meningkatkan engagement konten secara otomatis.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="premium-card rounded-2xl border-white/5 bg-black/40 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/70">Target Video Link</Label>
                <Input 
                  placeholder="https://..." 
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
                onClick={() => handleOrder("shopee")}
                disabled={isOrdering || !url}
                className="w-full h-12 rounded-xl luxury-gradient font-bold text-sm shadow-xl"
              >
                {isOrdering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {orderFeedback === 'success' ? "Trafik Dikirim!" : isOrdering ? "Memproses..." : "Mulai Booster Sekarang"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="premium-card rounded-2xl border-white/5 bg-black/40 lg:col-span-4 h-fit">
          <CardHeader className="py-4 border-b border-white/5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" /> Panduan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-xs space-y-3 text-muted-foreground leading-relaxed">
            <p>• Akun tidak boleh dalam mode <strong>Privat</strong>.</p>
            <p>• Tarif: <strong>1.000 Views = 1 Koin</strong>.</p>
            <p>• Status berubah otomatis dalam 50 detik.</p>
            <div className="pt-2">
              <Badge className="bg-amber-500/10 text-amber-500 border-none text-[9px] uppercase font-black px-2 py-0.5">Note</Badge>
              <p className="mt-1">Riwayat di-reset otomatis setiap 3 hari.</p>
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
                  <TableHead className="text-white text-xs font-bold text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">Memuat data...</TableCell></TableRow>
                ) : history.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground italic">Tidak ada riwayat dalam 3 hari terakhir.</TableCell></TableRow>
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
                            row.status === "SELESAI" ? "bg-green-500" : "bg-amber-500 animate-pulse"
                        )}>{row.status || "PENDING"}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-[10px] text-muted-foreground">
                        {row.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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