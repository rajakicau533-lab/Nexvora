"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingBag, Music, ShieldCheck, Zap, Info, Clock, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp, query, where, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder, checkOrderStatus } from "@/ai/flows/process-traffic-order-flow"

export default function TrafficServicePage() {
  const [url, setUrl] = useState("")
  const [views, setViews] = useState(1000)
  const [isOrdering, setIsOrdering] = useState(false)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const coinCost = Math.ceil(views / 1000)

  // API Settings for provider from central config
  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings, loading: settingsLoading } = useDoc(apiSettingsRef)

  // User Profile
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
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: history } = useCollection<any>(historyQuery)

  // Status Auto-Update Logic
  useEffect(() => {
    if (!db || !apiSettings || !history || history.length === 0) return;

    const interval = setInterval(async () => {
      // Find orders that are still pending and were created at least 1 minute ago
      const pendingOrders = history.filter((order: any) => {
        if (order.status !== "PENDING" && order.status !== "processing") return false;
        
        const createdAt = order.createdAt?.toDate?.() || new Date();
        const oneMinuteAgo = new Date(Date.now() - 60000);
        return createdAt < oneMinuteAgo;
      });

      if (pendingOrders.length === 0) return;

      console.log(`[STATUS CHECK] Checking ${pendingOrders.length} pending orders...`);

      for (const order of pendingOrders) {
        if (!order.providerOrderId) continue;

        try {
          const result = await checkOrderStatus({
            apiUrl: apiSettings.apiUrl,
            apiKey: apiSettings.apiKey,
            orderId: order.providerOrderId
          });

          if (result.success && result.status) {
            const providerStatus = result.status.toLowerCase();
            let newStatus = "PENDING";

            if (["completed", "success", "partial"].includes(providerStatus)) {
              newStatus = "SELESAI";
            } else if (["canceled", "cancelled", "failed", "error"].includes(providerStatus)) {
              newStatus = "GAGAL";
            } else if (["processing", "in progress", "pending"].includes(providerStatus)) {
              newStatus = "PENDING";
            }

            // Update only if status changed
            if (newStatus !== order.status) {
              await updateDoc(doc(db, "traffic_orders", order.id), {
                status: newStatus,
                updatedAt: serverTimestamp(),
                rawProviderStatus: result.status
              });
              console.log(`[STATUS CHECK] Order #${order.providerOrderId} updated to ${newStatus}`);
            }
          }
        } catch (err) {
          console.error("Status check failed for order:", order.id, err);
        }
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [db, apiSettings, history]);

  const validateUrl = (input: string, platform: "shopee" | "tiktok") => {
    try {
      const parsed = new URL(input.startsWith('http') ? input : `https://${input}`);
      const hostname = parsed.hostname.toLowerCase();

      if (platform === "shopee") {
        const allowedShopeeDomains = ['shopee.co.id', 'shp.ee', 'id.shp.ee', 's.shopee.co.id', 'vn.shp.ee', 'my.shp.ee', 'th.shp.ee', 'ph.shp.ee'];
        return allowedShopeeDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
      }
      return platform === "tiktok" ? hostname.includes('tiktok.com') : false;
    } catch (e) { return false; }
  };

  const handleOrder = async (platform: "shopee" | "tiktok") => {
    if (!db || !user?.uid || !profile) return
    
    if (!apiSettings?.apiUrl || !apiSettings?.apiKey || !apiSettings?.serviceId) {
      toast({ variant: "destructive", title: "Layanan Tidak Tersedia", description: "Admin belum mengonfigurasi API SMM.ID." })
      return
    }

    if (apiSettings.active === false) {
      toast({ variant: "destructive", title: "Layanan Maintenance", description: "Layanan booster sedang dalam pemeliharaan rutin." })
      return
    }

    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Saldo Koin Kurang", description: `Dibutuhkan ${coinCost} koin, saldo Anda ${profile.coins} koin.` })
      return
    }

    if (!url || !validateUrl(url, platform)) {
      toast({ variant: "destructive", title: "Link Tidak Valid", description: "Pastikan URL yang Anda masukkan benar." })
      return
    }

    setIsOrdering(true)

    try {
      // Step 1: Call SMM.ID API
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey,
        serviceId: apiSettings.serviceId,
        link: url,
        quantity: views
      })

      // Step 2: Log to API audit logs
      await setDoc(doc(collection(db, "api_logs")), {
        timestamp: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
        link: url,
        quantity: views,
        provider: apiSettings.provider || 'SMM.ID',
        requestPayload: { action: 'add', service: apiSettings.serviceId, link: url, quantity: views },
        responseBody: apiResult.rawResponse || apiResult.debugInfo || null,
        errorMessage: apiResult.success ? null : apiResult.error,
        status: apiResult.success ? 'success' : 'failed'
      })

      if (!apiResult.success) {
        throw new Error(apiResult.error || "Provider SMM.ID menolak pesanan.");
      }

      // Step 3: Success Flow - Store to traffic_orders and deduct coins
      const orderRef = doc(collection(db, "traffic_orders"))
      await setDoc(orderRef, {
        userId: user.uid,
        username: profile.username || "Unknown",
        userEmail: user.email,
        platform,
        targetLink: url,
        quantity: views,
        coinCost,
        status: "PENDING",
        providerOrderId: apiResult.orderId,
        providerServiceId: apiSettings.serviceId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      await updateDoc(profileRef!, { coins: increment(-coinCost) })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -coinCost,
        type: "traffic_order",
        description: `Booster ${platform}: ${views} Views (ID: ${apiResult.orderId})`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Pesanan Diterima! 🚀", description: `Order ID #${apiResult.orderId} sedang diproses.` })
      setUrl("")
    } catch (err: any) {
      console.error("TRAFFIC_SUBMIT_ERROR:", err)
      toast({ variant: "destructive", title: "Gagal Proses", description: err.message || "Koneksi ke SMM.ID gagal." })
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Booster Trafik Otomatis 🚀</h2>
        <p className="text-muted-foreground italic">Layanan premium untuk menaikkan engagement konten Anda secara instan.</p>
      </div>

      <Tabs defaultValue="shopee" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8 w-full max-w-md grid grid-cols-2 h-14 rounded-2xl">
          <TabsTrigger value="shopee" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-primary">
            <ShoppingBag className="h-4 w-4" /> Shopee Video
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="rounded-xl flex items-center gap-2 data-[state=active]:bg-primary">
            <Music className="h-4 w-4" /> TikTok View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopee" className="space-y-8">
          <div className="grid md:grid-cols-5 gap-8">
            <Card className="premium-card col-span-3 rounded-3xl border-white/5 bg-black/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Form Pemesanan Shopee</CardTitle>
                <CardDescription>Target: Link Video atau Shortlink (id.shp.ee).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-white font-bold">Link Video Shopee</Label>
                  <Input 
                    id="url" 
                    placeholder="https://id.shp.ee/xxxxxx" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-primary/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="views" className="text-white font-bold">Jumlah Tayangan (Min 1,000)</Label>
                  <Input 
                    id="views" 
                    type="number" 
                    step="1000"
                    min="1000"
                    value={views}
                    onChange={(e) => setViews(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white"
                  />
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Tarif: 1.000 Views = 1 Koin 🪙</p>
                </div>

                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Estimasi Biaya:</span>
                    <span className="text-2xl font-headline font-bold text-primary">{coinCost} Koin</span>
                </div>

                <Button 
                  onClick={() => handleOrder("shopee")}
                  disabled={isOrdering || !url || views < 1000 || settingsLoading}
                  className="w-full h-14 rounded-xl luxury-gradient border-none text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isOrdering ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Sedang Menghubungkan API...
                    </div>
                  ) : "Booster Sekarang 🚀"}
                </Button>
              </CardContent>
            </Card>

            <Card className="premium-card col-span-2 rounded-3xl border-white/5 bg-black/40 h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" /> Panduan Pemesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground">
                <div className="flex gap-3">
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0">1</Badge>
                  <p>Pastikan akun Shopee/TikTok Anda <strong>tidak diprivat</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0">2</Badge>
                  <p>Status akan dicek otomatis ke server provider setiap 60 detik.</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0">3</Badge>
                  <p>Proses pengiriman biasanya memakan waktu 5-60 menit.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mt-4">
                  <p className="text-[10px] text-white font-bold uppercase mb-1">Status Legends:</p>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-black">
                    <span className="text-amber-500">PENDING = Antrean</span>
                    <span className="text-green-500">SELESAI = Sukses</span>
                    <span className="text-red-500">GAGAL = Batal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiktok">
          <div className="p-20 text-center premium-card rounded-[2.5rem] border-dashed border-primary/20 bg-black/40 opacity-60">
            <Music className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-headline font-bold text-white mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Layanan TikTok View sedang dalam tahap integrasi kestabilan server.</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-6">
        <h3 className="text-2xl font-headline font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" /> Riwayat Booster Saya
        </h3>
        <Card className="premium-card rounded-3xl border-white/5 overflow-hidden bg-black/40 shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 h-14">
                <TableHead className="text-white font-bold">Link Video</TableHead>
                <TableHead className="text-white font-bold">View</TableHead>
                <TableHead className="text-white font-bold">Koin</TableHead>
                <TableHead className="text-white font-bold">Order ID</TableHead>
                <TableHead className="text-white font-bold">Status</TableHead>
                <TableHead className="text-white font-bold">Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!history || history.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">Belum ada riwayat pesanan.</TableCell></TableRow>
              ) : (
                history.map((row: any) => (
                  <TableRow key={row.id} className="border-white/5 hover:bg-white/5 transition-colors h-16">
                    <TableCell className="max-w-[200px]">
                      <a href={row.targetLink || row.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary truncate">
                        <ExternalLink className="h-3 w-3 shrink-0" /> {row.targetLink || row.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-white text-sm">{(row.quantity || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                        {row.coinCost} 🪙
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[10px] text-muted-foreground bg-white/5 px-2 py-1 rounded">
                        {row.providerOrderId || row.id.slice(0,8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                          "font-black text-[9px] px-3 py-1 uppercase rounded-lg",
                          row.status === "SELESAI" ? "bg-green-500" : 
                          row.status === "GAGAL" ? "bg-red-500" : 
                          "bg-amber-500 animate-pulse"
                      )}>{row.status || "PENDING"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-muted-foreground">
                        <span className="font-bold text-white">{row.createdAt?.toDate?.().toLocaleDateString() || '-'}</span>
                        <span>{row.createdAt?.toDate?.().toLocaleTimeString() || '-'}</span>
                      </div>
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