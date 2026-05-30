"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Download, CreditCard, Sparkles, CheckCircle2 } from "lucide-react"
import { useFirestore, useUser, useCollection } from "@/firebase"
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

  // Fetch user purchases
  const purchasesQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "marketplace_purchases"), where("userId", "==", user.uid))
  }, [db, user?.uid])

  const { data: purchases } = useCollection<any>(purchasesQuery)

  const handlePurchase = async (product: any) => {
    if (!db || !user?.uid) return
    
    // Check if user has enough coins (this should also be checked on user profile data)
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

      // 2. Deduct coins and log transaction
      await updateDoc(userRef, {
        coins: increment(-product.priceCoins)
      })

      // 3. Log transaction
      const txRef = doc(collection(db, "coin_transactions"))
      await setDoc(txRef, {
        userId: user.uid,
        amount: -product.priceCoins,
        type: "purchase",
        description: `Beli Produk: ${product.name}`,
        createdAt: serverTimestamp()
      })

      toast({
        title: "Pembelian Berhasil!",
        description: `Anda telah membeli ${product.name}. Silakan download file Anda.`,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Gagal Membeli",
        description: err.message || "Pastikan koin Anda cukup.",
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Marketplace Digital 🛍️</h2>
        <p className="text-muted-foreground">Koleksi produk digital premium untuk mendukung bisnis Anda.</p>
      </div>

      {!products || products.length === 0 ? (
        <Card className="premium-card p-12 text-center border-dashed">
          <ShoppingBag className="h-12 w-12 text-primary/20 mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada produk tersedia di marketplace saat ini.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="premium-card flex flex-col overflow-hidden rounded-3xl">
              <div className="relative h-48 bg-white/5">
                <img 
                  src={product.imageUrl || "https://picsum.photos/seed/product/600/400"} 
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

      {/* History Section */}
      <div className="pt-8 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="text-primary h-5 w-5" /> Riwayat Pembelian
        </h3>
        <Card className="premium-card rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {!purchases || purchases.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic">Anda belum memiliki riwayat pembelian.</div>
            ) : (
              purchases.map((purchase) => (
                <div key={purchase.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-bold">{purchase.productName}</p>
                    <p className="text-xs text-muted-foreground">Dibeli pada: {purchase.createdAt?.toDate().toLocaleDateString() || 'Loading...'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-bold">-{purchase.amountCoins} 🪙</p>
                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500">SUKSES</Badge>
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
