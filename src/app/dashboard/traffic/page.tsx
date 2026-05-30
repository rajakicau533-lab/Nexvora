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

  const handleOrder = async (platform: "shopee" | "tiktok") => {
    if (!db || !user?.uid || !profile) return
    
    if (profile.coins < coinCost) {
      toast({
        variant: "destructive",
        title: "Saldo Kurang",
        description: `Anda butuh ${coinCost} koin, saldo Anda ${profile.coins} koin.`,
      })
      return
    }

    const activeOrders = history?.filter(o => o.status === "pending" || o.status === "processing")
    if (activeOrders && activeOrders.length > 0) {
      toast({
        variant: "destructive",
        title: "Order Aktif Ditemukan",
        description: "Selesaikan order sebelumnya sebelum membuat yang baru.",
      })
      return
    }

    setIsOrdering(true)

    try {
      const orderRef = doc(collection(db, "traffic_orders"))

      await setDoc(orderRef, {
        userId: user.uid,
        platform,
        url,
        views,
        coinCost,
        status: "pending",
        createdAt: serverTimestamp()
      })

      await updateDoc(profileRef!, {
        coins: increment(-coinCost)
      })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -coinCost,
        type: "traffic_order",
        description: `Order Trafik ${platform.toUpperCase()}: ${views} Views`,
        createdAt: serverTimestamp()
      })

      toast({
        title: "Pesanan Diterima! 🚀",
        description: "Status akan diperbarui secara berkala oleh admin.",
      })
      
      setUrl("")
      setViews(1000)
    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Booster Trafik Service 🚀</h2>
        <p className="text-muted-foreground">Meningkatkan interaksi video Shopee & TikTok secara instan.</p>
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
                <CardDescription>Masukkan data video Shopee yang ingin di-boost.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-white font-bold">Link Video Shopee</Label>
                  <Input 
                    id="url" 
                    placeholder="https://shopee.co.id/video/..." 
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
                  disabled={isOrdering || !url || views < 1000}
                  className="w-full h-14 rounded-xl luxury-gradient border-none text-lg font-bold shadow-xl shadow-primary/20 group"
                >
                  {isOrdering ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses Order...
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
                <p>• Proses sinkronisasi server: <span className="text-white font-bold">1 - 24 Jam</span>.</p>
                <p>• Masukkan URL lengkap video, bukan URL profil.</p>
                <p>• <span className="text-primary font-bold">Dilarang</span> mengganti link saat proses berjalan.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiktok">
          <div className="p-12 text-center premium-card rounded-[2rem] border-dashed border-primary/20 bg-black/40">
            <Music className="h-16 w-16 text-primary mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-headline font-bold text-white mb-2">TikTok Service Update</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Kami sedang meningkatkan stabilitas server TikTok agar hasil booster lebih permanen.</p>
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
              <TableHead className="text-white font-bold">Views</TableHead>
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
                  <TableCell className="text-white font-bold">{row.views.toLocaleString()}</TableCell>
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