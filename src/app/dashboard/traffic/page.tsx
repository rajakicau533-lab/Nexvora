"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TrendingUp, ShoppingBag, Music, ShieldCheck, Zap, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function TrafficServicePage() {
  const [url, setUrl] = useState("")
  const [views, setViews] = useState(1000)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)

  const coinCost = Math.ceil(views / 1000)

  const handleOrder = () => {
    setIsOrdering(true)
    // Simulate API call
    setTimeout(() => {
      setIsOrdering(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 10000)
    }, 1500)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Trafik Service 🚀</h2>
        <p className="text-muted-foreground">Booster view otomatis untuk meningkatkan engagement media sosial Anda.</p>
      </div>

      {showSuccess && (
        <Alert className="bg-green-500/20 border-green-500/50 text-green-500 animate-in fade-in slide-in-from-top-4 duration-500">
          <Zap className="h-4 w-4 fill-green-500" />
          <AlertTitle>Order Berhasil!</AlertTitle>
          <AlertDescription>Pesanan Anda sedang diproses. View akan bertambah secara bertahap dalam 24 jam.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="shopee" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-8 w-full max-w-md grid grid-cols-2 h-14 rounded-2xl">
          <TabsTrigger value="shopee" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Shopee
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2">
            <Music className="h-4 w-4" /> TikTok
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopee" className="space-y-8">
          <div className="grid md:grid-cols-5 gap-8">
            <Card className="premium-card col-span-3 rounded-3xl border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Shopee View Service</CardTitle>
                <CardDescription>Meningkatkan tayangan video Shopee Video Anda secara organik.</CardDescription>
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
                  <Label htmlFor="views">Jumlah View (Kelipatan 1000)</Label>
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
                      <ShieldCheck className="h-3 w-3 text-green-500" /> Checklist Keamanan Database
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 text-primary" /> Sebar Trafik Seluruh Indonesia
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleOrder}
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
                <p>• Pastikan akun/video tidak dalam mode privat.</p>
                <p>• Proses pengiriman view berlangsung antara 1-24 jam.</p>
                <p>• Dilarang membuat pesanan baru untuk link yang sama jika pesanan sebelumnya masih berstatus <b>Pending</b> atau <b>Processing</b>.</p>
                <p>• Masukkan URL dengan format yang benar untuk menghindari kegagalan sistem.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tiktok">
          <div className="p-12 text-center premium-card rounded-3xl border-dashed border-white/10">
            <Music className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-headline font-bold">TikTok Service Ready!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">Konsep layanan sama seperti Shopee, membantu video TikTok Anda masuk FYP dengan trafik organik Indonesia.</p>
            <Button variant="outline" className="border-white/10 bg-white/5 rounded-xl">Segera Aktif</Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* History Table */}
      <Card className="premium-card rounded-3xl border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle>Riwayat Trafik</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead className="w-[100px]">Nomor</TableHead>
              <TableHead>Link Video</TableHead>
              <TableHead>Total View</TableHead>
              <TableHead>Biaya</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { id: "#001", link: "shopee.co.id/video/...", views: "5,000", coins: "5", status: "Completed" },
              { id: "#002", link: "shopee.co.id/video/...", views: "10,000", coins: "10", status: "Processing" },
              { id: "#003", link: "tiktok.com/@user/...", views: "2,000", coins: "2", status: "Pending" },
            ].map((row, idx) => (
              <TableRow key={idx} className="hover:bg-white/5 transition-colors">
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell className="max-w-[200px] truncate text-primary underline">{row.link}</TableCell>
                <TableCell>{row.views}</TableCell>
                <TableCell>{row.coins} 🪙</TableCell>
                <TableCell>
                  <Badge 
                    className={cn(
                      "font-bold",
                      row.status === "Completed" && "bg-green-500/20 text-green-500 border-green-500/50",
                      row.status === "Processing" && "bg-blue-500/20 text-blue-500 border-blue-500/50",
                      row.status === "Pending" && "bg-amber-500/20 text-amber-500 border-amber-500/50",
                    )}
                    variant="outline"
                  >
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
