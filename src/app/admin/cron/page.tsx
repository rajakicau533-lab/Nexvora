"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CronConfigurationPage() {
  const router = useRouter()
  
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="premium-card max-w-md w-full rounded-[2rem] border-white/5 bg-black/40 p-10 text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl text-white">Cron Inactive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Konfigurasi Cron eksternal saat ini tidak diperlukan. Seluruh fitur berjalan dalam mode sinkron.
          </p>
          <Button onClick={() => router.push("/admin")} variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5">
            Kembali ke Admin Panel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
