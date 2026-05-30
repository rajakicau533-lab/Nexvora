
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Terminal, ExternalLink } from "lucide-react"
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

  const isConfigured = envVars.every(v => v.value && v.value !== "YOUR_API_KEY")

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold text-white">Nexvora Backend Setup 🛠️</h1>
        <p className="text-muted-foreground">Hubungkan aplikasi Anda ke Firebase untuk mengaktifkan seluruh fitur.</p>
      </div>

      <Card className="premium-card rounded-3xl border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle>Status Environment Variables</CardTitle>
          <CardDescription>Pastikan seluruh variabel di bawah ini sudah terisi di file .env Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {envVars.map((v) => (
              <div key={v.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-muted-foreground">{v.key}</p>
                  <p className="text-sm font-bold text-white truncate max-w-[300px]">
                    {v.value ? (v.value === "YOUR_API_KEY" ? "⚠️ Masih Placeholder" : "✅ Terdeteksi") : "❌ Kosong"}
                  </p>
                </div>
                {v.value && v.value !== "YOUR_API_KEY" ? (
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                ) : (
                  <AlertCircle className="text-destructive h-5 w-5" />
                )}
              </div>
            ))}
          </div>

          {!isConfigured && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Konfigurasi Belum Lengkap</AlertTitle>
              <AlertDescription>
                Aplikasi tidak bisa berjalan sebelum Firebase API Key dimasukkan. 
                Edit file <b>.env</b> di root folder dan isi dengan data dari Firebase Console.
              </AlertDescription>
            </Alert>
          )}

          {isConfigured && (
            <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 mx-auto" />
              <div className="space-y-1">
                <p className="text-lg font-bold">Firebase Berhasil Terhubung!</p>
                <p className="text-sm opacity-80">Restart aplikasi Anda jika perubahan belum terlihat.</p>
              </div>
              <Button asChild className="luxury-gradient border-none w-full h-12 rounded-xl">
                <a href="/">Masuk ke Nexvora Studio</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="premium-card rounded-3xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" /> Panduan Cepat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="list-decimal list-inside space-y-3 leading-relaxed">
            <li>Buka <a href="https://console.firebase.google.com/" target="_blank" className="text-primary hover:underline inline-flex items-center">Firebase Console <ExternalLink className="h-3 w-3 ml-1" /></a></li>
            <li>Klik <b>Project Settings</b> (ikon gear) &gt; <b>General</b>.</li>
            <li>Scroll ke bawah ke bagian <b>Your apps</b>.</li>
            <li>Pilih ikon <b>&lt;/&gt; (Web App)</b> jika belum ada.</li>
            <li>Salin objek <b>firebaseConfig</b> dan masukkan ke file <b>.env</b> di project Anda.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
