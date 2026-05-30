
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Download, CreditCard, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase"
import { collection, query, doc, setDoc, updateDoc, increment, serverTimestamp, where } from "firebase/firestore"
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

  // Fetch current user profile for real coins balance
  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  
  const { data: profile } = useDoc(profileRef)

  // Fetch user purchases
  const purchasesQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "marketplace_purchases"), where("userId", "==", user.uid))
  }, [db, user?.uid])

  const { data: purchases } = useCollection<any>(purchasesQuery)

  const handlePurchase = async (product: any) => {
    if (!db || !user?.uid || !profile) return
    
    // Check if user has enough coins
    if (profile.coins < product.priceCoins) {
      toast({
        variant: "destructive",
        title: "Koin Tidak Cukup",
        description: `Anda butuh ${product.priceCoins} koin, saldo Anda: ${profile.coins} koin.`,
      })
      return
    }

    setIsBuying(product.id)

    try {
      const purchaseRef = doc(collection(db, "marketplace_purchases"))
      const userRef = doc(db, "users", user.uid)

      // 1. Create purchase record
      await setDoc(purchaseRef, {
        userId: user.uid,
        productId: product.id,
        productName: product.name,
        amountCoins: product.priceCoins,
        createdAt: serverTimestamp()
      })

      // 2. Deduct coins from profile
      await updateDoc(userRef, {
        coins: increment(-product.priceCoins)
      })

      // 3. Log transaction history
      const txRef = doc(collection(db, "coin_transactions"))
      await setDoc(txRef, {
        userId: user.uid,
        amount: -product.priceCoins,
        type: "purchase",
        description: `Beli Produk Digital: ${product.name}`,
        createdAt: serverTimestamp()
      })

      toast({
        title: "Pembelian Berhasil! 🎉",
        description: `Anda telah mendapatkan ${product.name}. Silakan download di menu Riwayat.`,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Gagal Membeli",
        description: err.message || "Terjadi kesalahan pada sistem.",
      })
    } finally {
      setIsBuying(null)
    }
  }

  const isOwned = (productId: string) => {
    return purchases?.some(p => p.productId === productId)
  }

  if (productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse font-headline">Sinkronisasi Marketplace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold">Marketplace Digital 🛍️</h2>
          <p className="text-muted-foreground">Koleksi produk digital premium untuk mendukung bisnis Anda.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Saldo: {profile?.coins || 0} Koin</span>
        </div>
      </div>

      {!products || products.length === 0 ? (
        <Card className="premium-card p-12 text-center border-dashed bg-black/20">
          <ShoppingBag className="h-12 w-12 text-primary/20 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Belum ada produk tersedia di marketplace saat ini.</p>
          <p className="text-xs text-muted-foreground/60 italic">(Admin: Gunakan Firestore untuk menambahkan dokumen ke marketplace_products)</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="premium-card flex flex-col overflow-hidden rounded-3xl bg-black/40">
              <div className="relative h-48 bg-white/5">
                <img 
                  src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-primary font-bold px-3 py-1 text-sm">
                    {product.priceCoins} 🪙
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-4 border-t border-white/5">
                {isOwned(product.id) ? (
                  <Button asChild className="w-full h-12 rounded-xl luxury-gradient">
                    <a href={product.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download Produk
                    </a>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handlePurchase(product)}
                    disabled={isBuying === product.id}
                    className="w-full h-12 rounded-xl luxury-gradient"
                  >
                    {isBuying === product.id ? "Memproses..." : <><CreditCard className="mr-2 h-4 w-4" /> Beli Sekarang</>}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase History */}
      <div className="pt-8 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="text-primary h-5 w-5" /> Riwayat Pembelian
        </h3>
        <Card className="premium-card rounded-2xl overflow-hidden bg-black/40">
          <div className="divide-y divide-white/5">
            {!purchases || purchases.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic">Anda belum memiliki riwayat pembelian.</div>
            ) : (
              purchases.map((purchase) => (
                <div key={purchase.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-white">{purchase.productName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      ID: {purchase.id} • {purchase.createdAt?.toDate().toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-primary font-bold">-{purchase.amountCoins} 🪙</p>
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500">SUKSES</Badge>
                    </div>
                    {/* Assuming we might want to let them download again from here */}
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/20 text-primary">
                       <Download className="h-4 w-4" />
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
