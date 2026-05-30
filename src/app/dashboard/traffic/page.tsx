"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShoppingBag, Music, ShieldCheck, Zap, Info, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection } from "@/firebase"
import { collection, query, doc, setDoc, updateDoc, increment, serverTimestamp, where, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function TrafficServicePage() {
  const [url, setUrl] = useState("")
  const [views, setViews] = useState(1000)
  const [isOrdering, setIsOrdering] = useState(false)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const coinCost = Math.ceil(views / 1000)

  // Fetch order history
  const historyQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "traffic_orders"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: history } = useCollection<any>(historyQuery)

  const handleOrder = async (platform: "shopee" | "tiktok") => {
    if (!db || !user?.uid) return
    
    // Check for existing pending orders
    const activeOrders = history?.filter(o => o.status === "pending" || o.status === "processing")
    if (activeOrders && activeOrders.length > 0) {
      toast({
        variant: "destructive",
        title: "Order Gagal",
        description: "Anda masih memiliki order yang sedang diproses untuk platform ini.",
      })
      return
    }

    setIsOrdering(true)

    try {
      const orderRef = doc(collection(db, "traffic_orders"))
      const userRef = doc(db, "users", user.uid)

      // 1. Create order
      await setDoc(orderRef, {
        userId: user.uid,
        platform,
        url,
        views,
        coinCost,
        status: "pending",
        createdAt: serverTimestamp()
      })

      // 2. Deduct coins
      await updateDoc(userRef, {
        coins: increment(-coinCost)
      })

      // 3. Log transaction
      const txRef = doc(collection(db, "coin_transactions"))
      await setDoc(txRef, {
        userId: user.uid,
        amount: -coinCost,
        type: "traffic_order",
        description: `Order Trafik ${platform.toUpperCase()}: ${views} Views`,
        createdAt: serverTimestamp()
      })

      toast({
        title: "Order Berhasil!",
        description: "Pesanan Anda sedang dalam antrian sistem.",
      })
      
      setUrl("")
      setViews(1000)
    } catch (err: any) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Gagal Membuat Order",
        description: err.message || "Pastikan koin Anda cukup.",
      })
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Trafik Service 🚀</h2>
        <p className="text-muted-foreground">Booster view otomatis untuk meningkatkan engagement media sosial Anda.</p>
      </div>

      <Tabs defaultValue="shopee" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8 w-full max-w-md grid grid-cols-2 h-14 rounded-2xl">
          <TabsTrigger value="shopee" className="rounded-xl flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Shopee
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="rounded-xl flex items-center gap-2">
            <Music className="h-4 w-4" /> TikTok
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopee" className="space-y-8">
          <div className="grid md:grid-cols-5 gap-8">
            <Card className="premium-card col-span-3 rounded-3xl border-white/5">
              <CardHeader>
                <CardTitle>Shopee View Service</CardTitle>
                <CardDescription>Meningkatkan tayangan video Shopee Video Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">URL Video Shopee</Label>
                  <Input 
                    id="url" 
                    placeholder="https://shopee.co.id/video/..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="views">Jumlah View (Min 1,000)</Label>
                  <Input 
                    id="views" 
                    type="number" 
                    step="1000"
                    min="1000"
                    value={views}
                    onChange={(e) => setViews(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 rounded-xl h-12"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Note: 1000 Views = 1 Koin Nexvora</p>
                </div>

                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimasi Biaya:</span>
                    <span className="text-xl font-headline font-bold text-primary">{coinCost} Koin 🪙</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-green-500" /> Database Terenkripsi
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" /> Trafik High Quality
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleOrder("shopee")}
                  disabled={isOrdering || !url || views < 1000}
                  className="w-full h-14 rounded-xl luxury-gradient border-none text-lg font-bold shadow-xl shadow-primary/20"
                >
                  {isOrdering ? "Memproses..." : "Booster Trafik Sekarang"}
                </Button>
              </CardContent>
            </Card>

            <Card className="premium-card col-span-2 rounded-3xl border-white/5 h-fit">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" /> Ketentuan Layanan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground">
                <p>• Pastikan akun tidak dalam mode privat.</p>
                <p>• Proses pengiriman view: 1-24 jam.</p>
                <p>• Maksimal 1 order aktif per platform.</p>
                <p>• Masukkan URL lengkap dan benar.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiktok">
          {/* Similar structure for TikTok... simplified for MVP */}
          <div className="p-12 text-center premium-card rounded-3xl border-dashed border-white/10">
            <Music className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-headline font-bold">TikTok Service Coming Soon</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Fitur ini sedang dalam tahap finalisasi keamanan.</p>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="premium-card rounded-3xl border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Riwayat Order</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Biaya</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!history || history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada riwayat order.</TableCell>
              </TableRow>
            ) : (
              history.map((row: any) => (
                <TableRow key={row.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold uppercase text-xs">{row.platform}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-primary text-xs underline">
                    <a href={row.url} target="_blank" rel="noopener noreferrer">{row.url}</a>
                  </TableCell>
                  <TableCell>{row.views.toLocaleString()}</TableCell>
                  <TableCell>{row.coinCost} 🪙</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "font-bold text-[10px]",
                        row.status === "completed" && "bg-green-500/20 text-green-500 border-green-500/50",
                        row.status === "processing" && "bg-blue-500/20 text-blue-500 border-blue-500/50",
                        row.status === "pending" && "bg-amber-500/20 text-amber-500 border-amber-500/50",
                        row.status === "failed" && "bg-red-500/20 text-red-500 border-red-500/50",
                      )}
                      variant="outline"
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
