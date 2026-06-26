"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Star, TrendingUp, ExternalLink } from "lucide-react"

interface ProductTrendCardProps {
  product: any
}

export function ProductTrendCard({ product }: ProductTrendCardProps) {
  return (
    <Card className="premium-card rounded-[2rem] overflow-hidden bg-black/40 border-white/5 hover:border-amber-500/30 transition-all duration-500 group">
      <div className="aspect-square relative overflow-hidden bg-white/5">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4">
           <Badge className="bg-black/60 backdrop-blur-md border-amber-500/50 text-amber-500 font-black flex items-center gap-1 px-3">
              <Star className="h-3 w-3 fill-amber-500" /> {product.rating}
           </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
           <Button asChild className="w-full luxury-gradient rounded-xl font-bold">
              <a href={product.link} target="_blank" rel="noopener noreferrer">
                Buka Link Produk <ExternalLink className="ml-2 h-4 w-4" />
              </a>
           </Button>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
           <h4 className="text-white font-bold text-sm line-clamp-2 leading-snug group-hover:text-amber-500 transition-colors">{product.title}</h4>
           <div className="flex items-center justify-between">
              <p className="text-amber-500 font-black text-lg">{product.price}</p>
              <p className="text-[10px] text-white/40 font-bold uppercase">{product.sold} Terjual</p>
           </div>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
           <p className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> Tren Penjualan
           </p>
           <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Harian', val: product.trends.daily },
                { label: 'Mingguan', val: product.trends.weekly },
                { label: 'Bulanan', val: product.trends.monthly }
              ].map((t, i) => (
                <div key={i} className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
                   <p className="text-[8px] text-muted-foreground uppercase font-black mb-0.5">{t.label}</p>
                   <p className="text-[11px] font-black text-green-500">↑ {t.val}</p>
                </div>
              ))}
           </div>
        </div>
      </CardContent>
    </Card>
  )
}
