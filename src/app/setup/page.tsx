"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Terminal, ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SetupPage() {
  const envVars = [
    { key: "NEXT_PUBLIC_FIREBASE_API_KEY", value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
    { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
    { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
    { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
    { key: "NEXT_PUBLIC_FIREBASE_APP_ID", value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
  ]

  const isConfigured = envVars.every(v => v.value && v.value !== "YOUR_API_KEY" && v.value !== "undefined")

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 py-12 px-4 bg-[#0F0F0F] min-h-screen flex flex-col justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
          <ShieldCheck className="text-primary h-8 w-8" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-white">Nexvora Backend Setup</h1>
        <p className="text-muted-foreground text-lg">Hubungkan ekosistem digital Anda ke Firebase Cloud.</p>
      </div>

      <Card className="premium-card rounded-[2rem] border-white/10 bg-black/60 backdrop-blur-xl">
        <CardHeader className="text-center border-b border-white/5">
          <CardTitle className="text-white">Status Konfigurasi</CardTitle>
          <CardDescription className="text-muted-foreground">Audit otomatis variabel lingkungan proyek.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="grid gap-4">
            {envVars.map((v) => (
              <div key={v.key} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">{v.key.replace('NEXT_PUBLIC_FIREBASE_', '')}</p>
                  <p className="text-sm font-bold text-white truncate max-w-[250px] md:max-w-[400px]">
                    {v.value && v.value !== "YOUR_API_KEY" && v.value !== "undefined" ? "AKTIF: " + v.value.slice(0, 20) + "..." : "TIDAK TERDETEKSI"}
                  </p>
                </div>
                {v.value && v.value !== "YOUR_API_KEY" && v.value !== "undefined" ? (
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                    <AlertCircle className="text-destructive h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isConfigured && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-white rounded-2xl p-6">
              <AlertCircle className="h-5 w-5 text-primary" />
              <AlertTitle className="font-bold text-lg mb-2">Konfigurasi Belum Lengkap</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground leading-relaxed">
                Silakan edit file <code className="bg-black/40 px-2 py-0.5 rounded text-primary">.env</code> di root folder aplikasi Anda dan isi dengan data dari Firebase Console. Setelah itu, simpan file dan jalankan ulang server development.
              </AlertDescription>
            </Alert>
          )}

          {isConfigured && (
            <div className="p-8 rounded-[2rem] bg-green-500/5 border border-green-500/20 text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-green-500 h-10 w-10" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-headline font-bold text-white">Firebase Terhubung!</p>
                <p className="text-muted-foreground">Koneksi backend Nexvora Studio telah diverifikasi dan siap digunakan.</p>
              </div>
              <Button asChild className="luxury-gradient border-none w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                <a href="/">Mulai Gunakan Platform</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg text-primary">
            <Terminal className="h-5 w-5" /> Panduan Pengaturan API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <ol className="list-decimal list-inside space-y-4">
            <li>Buka <a href="https://console.firebase.google.com/" target="_blank" className="text-primary font-bold hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="h-3 w-3" /></a></li>
            <li>Pilih project Anda, lalu klik ikon <b>Settings (Gear)</b> > <b>Project Settings</b>.</li>
            <li>Di tab <b>General</b>, scroll ke bawah ke bagian <b>Your apps</b>.</li>
            <li>Pilih ikon <b>Web (&lt;/&gt;)</b> untuk membuat aplikasi web baru.</li>
            <li>Salin nilai dari objek <code className="text-white">firebaseConfig</code> ke file <code className="text-white">.env</code> sesuai nama variabel di atas.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
