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
        const allowedShopeeDomains = [
          'shopee.co.id',
          'shp.ee',
          'id.shp.ee',
          's.shopee.co.id',
          'vn.shp.ee',
          'my.shp.ee',
          'th.shp.ee',
          'ph.shp.ee'
        ];
        return allowedShopeeDomains.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        );
      }

      if (platform === "tiktok") {
        return hostname.includes('tiktok.com');
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  const handleOrder = async (platform: "shopee" | "tiktok") => {
    if (!db || !user?.uid || !profile) return
    
    // 1. Validate configuration exists and is active
    if (!apiSettings?.apiUrl || !apiSettings?.apiKey || !apiSettings?.serviceId) {
      toast({ variant: "destructive", title: "Layanan Tidak Tersedia", description: "Provider belum dikonfigurasi oleh admin." })
      return
    }

    if (apiSettings.active === false) {
      toast({ variant: "destructive", title: "Layanan Dimatikan", description: "Layanan booster sedang dalam pemeliharaan rutin." })
      return
    }

    // 2. Validate balance
    if (profile.coins < coinCost) {
      toast({ variant: "destructive", title: "Saldo Kurang", description: `Anda butuh ${coinCost} koin, saldo Anda ${profile.coins} koin.` })
      return
    }

    // 3. Enhanced URL validation
    if (!url) {
      toast({ variant: "destructive", title: "Link Kosong", description: "Silakan masukkan URL target." })
      return
    }

    if (!validateUrl(url, platform)) {
      const errorMsg = platform === "shopee" 
        ? "Gunakan link shopee.co.id atau shortlink shp.ee yang valid."
        : "Gunakan link TikTok yang valid.";
      
      toast({ variant: "destructive", title: "Link Tidak Valid", description: errorMsg })
      return
    }

    setIsOrdering(true)

    try {
      // 4. Call Provider API first via Genkit Flow
      const apiResult = await processTrafficOrder({
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey,
        serviceId: apiSettings.serviceId,
        link: url,
        quantity: views
      })

      // Log to api_logs for audit (Requirement 11)
      await setDoc(doc(collection(db, "api_logs")), {
        timestamp: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
        link: url,
        quantity: views,
        provider: apiSettings.provider || 'IndoSMM',
        requestPayload: { action: 'add', service: apiSettings.serviceId, link: url, quantity: views },
        responseBody: apiResult.rawResponse || apiResult.debugInfo || null,
        errorMessage: apiResult.success ? null : apiResult.error,
        status: apiResult.success ? 'success' : 'failed'
      })

      if (!apiResult.success) {
        throw new Error(apiResult.error || "Provider menolak request.");
      }

      // 5. Success Flow: Deduct coins and save order
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
        providerResponse: apiResult.rawResponse,
        createdAt: serverTimestamp()
      })

      // Atomic coin deduction
      await updateDoc(profileRef!, {
        coins: increment(-coinCost)
      })

      // Log transaction
      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -coinCost,
        type: "traffic_order",
        description: `Order Trafik ${platform.toUpperCase()}: ${views} Views (ID: ${apiResult.orderId})`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Pesanan Diterima! 🚀", description: `ID: ${apiResult.orderId}. Booster sedang bekerja.` })
      setUrl("")
      setViews(1000)
    } catch (err: any) {
      console.error("TRAFFIC_ERROR:", err)
      toast({ variant: "destructive", title: "Gagal Proses", description: err.message || "Terjadi kesalahan saat menghubungi provider." })
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Booster Trafik Service 🚀</h2>
        <p className="text-muted-foreground">Meningkatkan interaksi video Shopee & TikTok secara instan menggunakan provider {apiSettings?.provider || 'IndoSMM'}.</p>
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
                <CardDescription>Mendukung URL panjang (shopee.co.id) dan shortlink (shp.ee/id.shp.ee).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-white font-bold">Link Video Shopee</Label>
                  <Input 
                    id="url" 
                    placeholder="https://id.shp.ee/xxxxxx atau https://shopee.co.id/video/..." 
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
                    className="bg-white/5 border-white/10 rounded-xl h-12 text-white focus:border-primary/50"
                  />
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Rate: 1.000 Views = 1 Koin Nexvora</p>
                </div>

                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Biaya Estimasi:</span>
                    <span className="text-2xl font-headline font-bold text-primary">{coinCost} Koin 🪙</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-green-500" /> SERVER HIGH SPEED
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" /> REAL ENGAGEMENT
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleOrder("shopee")}
                  disabled={isOrdering || !url || views < 1000 || settingsLoading}
                  className="w-full h-14 rounded-xl luxury-gradient border-none text-lg font-bold shadow-xl shadow-primary/20 group"
                >
                  {isOrdering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menghubungkan API...
                    </div>
                  ) : (
                    <>Booster Video Sekarang <Zap className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" /></>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="premium-card col-span-2 rounded-3xl border-white/5 h-fit bg-black/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" /> Ketentuan Layanan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground font-medium">
                <p>• Akun tidak boleh dalam mode <span className="text-white font-bold">PRIVATE</span>.</p>
                <p>• Koin hanya akan terpotong jika server berhasil memproses order.</p>
                <p>• Masukkan URL lengkap video atau link share aplikasi.</p>
                <p>• <span className="text-primary font-bold">Sistem otomatis</span> mendukung resolve shortlink Shopee Indonesia (id.shp.ee).</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiktok">
          <div className="p-12 text-center premium-card rounded-[2rem] border-dashed border-primary/20 bg-black/40">
            <Music className="h-16 w-16 text-primary mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-headline font-bold text-white mb-2">TikTok Service Update</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Sistem TikTok sedang dalam integrasi API V3 untuk kecepatan maksimal.</p>
            <Button disabled className="mt-8 rounded-xl bg-white/5 border border-white/10 text-muted-foreground">Tersedia Segera</Button>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="premium-card rounded-3xl border-white/5 overflow-hidden bg-black/40">
        <CardHeader className="bg-white/5">
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-primary" /> Riwayat Order Kustom</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white font-bold">Platform</TableHead>
              <TableHead className="text-white font-bold">Target URL</TableHead>
              <TableHead className="text-white font-bold">Provider ID</TableHead>
              <TableHead className="text-white font-bold">Koin</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!history || history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">Belum ada riwayat booster.</TableCell>
              </TableRow>
            ) : (
              history.map((row: any) => (
                <TableRow key={row.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-black uppercase text-[10px] text-primary tracking-widest">{row.platform}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs font-mono">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{row.url}</a>
                  </TableCell>
                  <TableCell className="text-white font-mono text-[10px]">{row.providerOrderId || '-'}</TableCell>
                  <TableCell className="text-primary font-bold">{row.coinCost} 🪙</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "font-black text-[9px] px-2 py-0.5 rounded-md border-none",
                        row.status === "completed" && "bg-green-500 text-white",
                        row.status === "processing" && "bg-blue-600 text-white animate-pulse",
                        row.status === "pending" && "bg-amber-500 text-black",
                        row.status === "failed" && "bg-red-600 text-white",
                      )}
                    >
                      {row.status.toUpperCase()}
                    </Badge>
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
