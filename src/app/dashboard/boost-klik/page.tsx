
"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Construction } from "lucide-react"
import Link from "next/link"

/**
 * @fileOverview Halaman Boost Klik dalam mode Maintenance.
 */
export default function BoostKlikMaintenancePage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4 animate-in fade-in duration-700">
      <Card className="premium-card w-full max-w-2xl rounded-[3rem] bg-black/60 border-white/5 overflow-hidden shadow-2xl relative">
        {/* Background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <CardContent className="p-12 md:p-20 text-center space-y-8 relative z-10">
          <div className="space-y-6">
             <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-primary/10 border border-primary/20 shadow-2xl shadow-primary/10">
                <Construction className="h-12 w-12 text-primary animate-pulse" />
             </div>
             
             <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">
                  🚧 Fitur Maintenance
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                  Fitur sedang maintenance, akan segera tersedia kembali.
                </p>
             </div>
          </div>

          <div className="pt-4">
             <Button asChild className="h-14 px-10 rounded-2xl luxury-gradient font-black text-lg shadow-xl shadow-primary/20 group">
                <Link href="/dashboard">
                   <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
                </Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
