"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, Copy, ExternalLink, ShieldCheck, AlertCircle, Terminal, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function CronConfigurationPage() {
  const { toast } = useToast()
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const endpointPath = "/api/scheduler/execute"
  const fullEndpoint = origin ? `${origin}${endpointPath}` : endpointPath

  const handleCopy = () => {
    navigator.clipboard.writeText(fullEndpoint)
    toast({
      title: "URL Disalin",
      description: "Endpoint scheduler berhasil disalin ke clipboard.",
    })
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3 text-nowrap">
          Cron Configuration <Clock className="text-primary h-7 w-7" />
        </h2>
        <p className="text-muted-foreground">Persiapan infrastruktur pemicu otomatis untuk layanan terjadwal.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/60 backdrop-blur-xl overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-lg text-white font-bold">Endpoint Scheduler</CardTitle>
              <CardDescription className="text-xs">Gunakan URL ini untuk memicu eksekusi antrean di sisi server.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1 opacity-60">Target API URL</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly
                    value={fullEndpoint}
                    className="bg-white/5 border-white/10 rounded-2xl h-14 font-mono text-[10px] text-primary focus:ring-0"
                  />
                  <Button onClick={handleCopy} className="h-14 w-14 rounded-2xl luxury-gradient shrink-0 shadow-lg shadow-primary/20">
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Informasi Keamanan</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Endpoint ini nantinya akan dilindungi oleh API Key rahasia untuk mencegah akses yang tidak sah. Untuk saat ini, status endpoint adalah <span className="text-primary font-bold">Stand-by</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
            <CardHeader className="p-8">
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" /> Panduan Setup Eksternal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 text-sm text-muted-foreground space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-bold text-white text-xs">1</div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-xs">Pilih Layanan Cron</p>
                    <p className="text-[11px]">Daftar di <strong>Cron-job.org</strong> (Gratis), <strong>EasyCron</strong>, atau gunakan <strong>GCP Cloud Scheduler</strong>.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-bold text-white text-xs">2</div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-xs">Masukkan Endpoint</p>
                    <p className="text-[11px]">Tempel URL yang sudah disalin di atas sebagai target HTTP GET request.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-bold text-white text-xs">3</div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-xs">Set Interval</p>
                    <p className="text-[11px]">Atur jadwal pemicu setiap <strong>1 Menit</strong> untuk akurasi penjadwalan yang optimal di Nexvora.</p>
                  </div>
                </div>
              </div>
              
              <Button asChild variant="outline" className="w-full h-12 mt-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all">
                <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer">
                  BUKA CRON-JOB.ORG <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-2 text-md text-white font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" /> Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {[
                { label: "Scheduler Endpoint", status: "Ready", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "Cron External", status: "Not Configured", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Scheduler Active", status: "No", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl", s.bg, s.color)}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-[13px] text-white/80">{s.label}</span>
                  </div>
                  <Badge variant="outline" className={cn("border-none px-3 text-[10px] font-black uppercase tracking-tighter", s.color, s.bg)}>{s.status}</Badge>
                </div>
              ))}

              <div className="p-5 rounded-[2rem] bg-black/40 border border-white/5 space-y-3 mt-4">
                 <p className="text-[10px] text-primary uppercase font-black tracking-[0.2em]">Pre-Implementation Note</p>
                 <p className="text-[11px] text-white/40 leading-relaxed italic font-medium">
                   Halaman ini hanya untuk keperluan pemantauan status pemicu eksternal. Fitur penjadwalan komentar saat ini belum diaktifkan pada modul Shopee Comment. Pastikan endpoint dapat dijangkau oleh internet publik.
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
