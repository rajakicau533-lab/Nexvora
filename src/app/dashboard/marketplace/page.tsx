"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Download, CreditCard, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, query, doc, setDoc, updateDoc, increment, serverTimestamp, where, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function MarketplacePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isBuying, setIsBuying] = useState<string | null>(null)

  // Fetch products
  const productsQuery = React.useMemo(() => {
    if (!db) return null
    return collection(db, "marketplace_products")
  }, [db])
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery)

  // User Profile
  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // User Purchases
  const purchasesQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "marketplace_purchases"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])
  const { data: purchases } = useCollection<any>(purchasesQuery)

  const handlePurchase = async (product: any) => {
    if (!db || !user?.uid || !profile) return
    
    if (profile.coins < product.priceCoins) {
      toast({
        variant: "destructive",
        title: "Koin Tidak Cukup",
        description: `Butuh ${product.priceCoins} koin. Saldo Anda: ${profile.coins} koin.`,
      })
      return
    }

    setIsBuying(product.id)

    try {
      const purchaseRef = doc(collection(db, "marketplace_purchases"))

      await setDoc(purchaseRef, {
        userId: user.uid,
        productId: product.id,
        productName: product.name,
        amountCoins: product.priceCoins,
        downloadUrl: product.downloadUrl,
        createdAt: serverTimestamp()
      })

      await updateDoc(profileRef!, {
        coins: increment(-product.priceCoins)
      })

      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -product.priceCoins,
        type: "purchase",
        description: `Beli Produk: ${product.name}`,
        createdAt: serverTimestamp()
      })

      toast({
        title: "Pembelian Berhasil! 🎉",
        description: `${product.name} telah ditambahkan ke koleksi Anda.`,
      })
    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Error", description: "Gagal memproses pembelian." })
    } finally {
      setIsBuying(null)
    }
  }

  const isOwned = (productId: string) => purchases?.some(p => p.productId === productId)

  if (productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-lg shadow-primary/20" />
        <p className="text-muted-foreground font-headline animate-pulse">Menghubungkan Marketplace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-headline font-bold text-white">Marketplace Premium 🛍️</h2>
          <p className="text-muted-foreground text-lg">Koleksi aset digital eksklusif untuk mempercepat pertumbuhan bisnis Anda.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-[1.5rem] flex items-center gap-3 backdrop-blur-md">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-white">Saldo Anda: {profile?.coins || 0} Koin</span>
        </div>
      </div>

      {!products || products.length === 0 ? (
        <Card className="premium-card p-20 text-center border-dashed bg-black/40 rounded-[2.5rem]">
          <ShoppingBag className="h-16 w-16 text-primary/20 mx-auto mb-6" />
          <h3 className="text-2xl font-headline font-bold text-white mb-2">Produk Belum Tersedia</h3>
          <p className="text-muted-foreground max-w-md mx-auto italic">Saat ini admin sedang menyiapkan katalog produk terbaru. Pastikan koin Anda cukup!</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card key={product.id} className="premium-card flex flex-col overflow-hidden rounded-[2rem] bg-black/40 group">
              <div className="relative h-56 bg-white/5 overflow-hidden">
                <img 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white font-black px-4 py-1.5 text-sm rounded-xl shadow-xl">
                    {product.priceCoins} 🪙
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <CardHeader className="relative -mt-8 pt-0 px-6">
                <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl">
                  <CardTitle className="text-xl text-white">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 text-muted-foreground">{product.description}</CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="mt-auto px-6 pb-6 pt-2">
                {isOwned(product.id) ? (
                  <Button asChild className="w-full h-14 rounded-2xl luxury-gradient font-black text-lg group">
                    <a href={product.downloadUrl} target="_blank" rel="noopener noreferrer">
                      Download Sekarang <Download className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                    </a>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handlePurchase(product)}
                    disabled={isBuying === product.id}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-white transition-all font-bold text-lg"
                  >
                    {isBuying === product.id ? "Memproses..." : <><CreditCard className="mr-2 h-5 w-5" /> Beli Dengan Koin</>}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      <div className="pt-12 space-y-6">
        <h3 className="text-2xl font-headline font-bold flex items-center gap-3">
          <CheckCircle2 className="text-primary h-6 w-6" /> Koleksi Saya
        </h3>
        <Card className="premium-card rounded-[2rem] overflow-hidden bg-black/40">
          <div className="divide-y divide-white/5">
            {!purchases || purchases.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">Anda belum memiliki riwayat pembelian.</div>
            ) : (
              purchases.map((purchase) => (
                <div key={purchase.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-white text-lg">{purchase.productName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                        DIBELI: {purchase.createdAt?.toDate().toLocaleDateString()} • ID: {purchase.id.slice(0,8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-primary font-black">-{purchase.amountCoins} 🪙</p>
                      <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-500 font-bold">SUKSES</Badge>
                    </div>
                    <Button asChild size="icon" className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-primary transition-all">
                       <a href={purchase.downloadUrl} target="_blank" rel="noopener noreferrer">
                         <Download className="h-5 w-5" />
                       </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}