"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AdminScheduledCommentsPage() {
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="premium-card max-w-md w-full rounded-[2rem] border-white/5 bg-black/40 p-10 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-primary" />
        </div>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl text-white">Layanan Dinonaktifkan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            Fitur pemantauan antrean komentar saat ini tidak tersedia untuk alasan stabilitas sistem.
          </p>
          <Button onClick={() => router.push("/admin")} className="w-full h-12 rounded-xl luxury-gradient font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Overview
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
