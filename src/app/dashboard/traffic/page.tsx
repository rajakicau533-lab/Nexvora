"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingBag, Music, ShieldCheck, Zap, Info, Clock, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, doc, setDoc, updateDoc, increment, serverTimestamp, query, where, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { processTrafficOrder } from "@/ai/flows/process-traffic-order-flow"

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
      toast({ variant: "destructive", title: "Link Tidak Valid", description: "Pastikan URL Shopee yang Anda masukkan benar." })
      return
    }

    setIsOrdering(true)

    try {
      // Step 1: Call SMM.ID API first
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey,
        serviceId: apiSettings.serviceId,
        link: url,
        quantity: views
      })

      // Step 2: Always Log to API audit logs for transparency
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

      // Step 3: SUCCESS FLOW - Deduct coins only if provider confirmed
      const orderRef = doc(collection(db, "traffic_orders"))
      await setDoc(orderRef, {
        userId: user.uid,
        userEmail: user.email,
        platform,
        url,
        views,
        coinCost,
        status: "processing",
        providerOrderId: apiResult.orderId,
        createdAt: serverTimestamp()
      })

      await updateDoc(profileRef!, { coins: increment(-coinCost) })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -coinCost,
        type: "traffic_order",
        description: `Shopee Video Booster: ${views} Views (ID: ${apiResult.orderId})`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Booster Aktif! 🚀", description: `Pesanan #${apiResult.orderId} sedang dikerjakan server.` })
      setUrl("")
    } catch (err: any) {
      console.error("TRAFFIC_SUBMIT_ERROR:", err)
      toast({ variant: "destructive", title: "Gagal Proses", description: err.message || "Koneksi ke SMM.ID gagal." })
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Booster Trafik SMM.ID 🚀</h2>
        <p className="text-muted-foreground italic">Layanan premium untuk menaikkan view video secara instan dan aman.</p>
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
            <Card className="premium-card col-span-3 rounded-3xl border-white/5 bg-black/40">
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
                  <p className="text-[10px] text-primary font-bold uppercase">Biaya: 1.000 Views = 1 Koin</p>
                </div>

                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Total Biaya:</span>
                    <span className="text-2xl font-headline font-bold text-primary">{coinCost} Koin 🪙</span>
                </div>

                <Button 
                  onClick={() => handleOrder("shopee")}
                  disabled={isOrdering || !url || views < 1000 || settingsLoading}
                  className="w-full h-14 rounded-xl luxury-gradient border-none text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {isOrdering ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" /> Menghubungkan API...
                    </div>
                  ) : "Booster Sekarang 🚀"}
                </Button>
              </CardContent>
            </Card>

            <Card className="premium-card col-span-2 rounded-3xl border-white/5 bg-black/40 h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" /> Panduan Order
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground">
                <p>• Akun tidak boleh diprivat.</p>
                <p>• Koin dipotong <strong>hanya jika</strong> server SMM.ID memvalidasi pesanan.</p>
                <p>• Proses pengiriman view 5-60 menit tergantung beban antrean server.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiktok">
          <div className="p-12 text-center premium-card rounded-[2rem] border-dashed border-primary/20 bg-black/40 opacity-60">
            <Music className="h-16 w-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-headline font-bold text-white mb-2">Segera Hadir</h3>
            <p className="text-muted-foreground">Layanan TikTok sedang dalam optimasi kestabilan.</p>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="premium-card rounded-3xl border-white/5 overflow-hidden bg-black/40">
        <CardHeader className="bg-white/5">
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-primary" /> Riwayat Booster Saya</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">Platform</TableHead>
              <TableHead className="text-white font-bold">Order ID</TableHead>
              <TableHead className="text-white font-bold">Views</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!history || history.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">Belum ada riwayat pesanan.</TableCell></TableRow>
            ) : (
              history.map((row: any) => (
                <TableRow key={row.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-black uppercase text-[10px] text-primary">{row.platform}</TableCell>
                  <TableCell className="text-white font-mono text-[10px]">{row.providerOrderId || row.id.slice(0,8)}</TableCell>
                  <TableCell className="text-white font-bold">{row.views?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                        "font-black text-[9px] px-2",
                        row.status === "processing" ? "bg-blue-600 animate-pulse" : "bg-green-500"
                    )}>{row.status.toUpperCase()}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}