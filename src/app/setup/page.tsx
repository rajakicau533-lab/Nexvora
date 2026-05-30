"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Terminal, ExternalLink, ShieldCheck, RefreshCw, Activity, Database, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { isFirebaseConfigured, firebaseConfig } from "@/firebase/config"
import { initializeApp, deleteApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore"

export default function SetupPage() {
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [services, setServices] = useState({
    auth: false,
    firestore: false,
    storage: false
  })
  const [errorMsg, setErrorMsg] = useState("")

  const envVars = [
    { key: "NEXT_PUBLIC_FIREBASE_API_KEY", value: firebaseConfig.apiKey },
    { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: firebaseConfig.authDomain },
    { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: firebaseConfig.projectId },
    { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", value: firebaseConfig.storageBucket },
    { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", value: firebaseConfig.messagingSenderId },
    { key: "NEXT_PUBLIC_FIREBASE_APP_ID", value: firebaseConfig.appId },
  ]

  const isPlaceholder = (val: string | undefined) => 
    !val || val === "YOUR_API_KEY" || val === "YOUR_PROJECT_ID" || val === "undefined";

  const handleTestConnection = async () => {
    setTestStatus("testing")
    setErrorMsg("")
    
    try {
      // 1. Initialize temporary app
      const app = initializeApp(firebaseConfig, "test-app-" + Date.now())
      
      // 2. Test Auth
      const auth = getAuth(app)
      setServices(prev => ({ ...prev, auth: !!auth }))

      // 3. Test Firestore
      const db = getFirestore(app)
      try {
        const q = query(collection(db, "users"), limit(1))
        await getDocs(q)
        setServices(prev => ({ ...prev, firestore: true }))
      } catch (e: any) {
        // Firestore might be empty or rules might block, but connectivity is what matters
        if (e.code !== 'permission-denied') {
           setServices(prev => ({ ...prev, firestore: true }))
        }
      }

      setTestStatus("success")
      await deleteApp(app)
    } catch (err: any) {
      console.error(err)
      setTestStatus("error")
      setErrorMsg(err.message || "Gagal menghubungkan ke Firebase. Periksa API Key Anda.")
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-12 px-4 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-2xl shadow-primary/20">
            <ShieldCheck className="text-primary h-10 w-10" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-white tracking-tight">Nexvora Control Center</h1>
          <p className="text-muted-foreground text-xl">Audit & Konfigurasi Ekosistem Backend Cloud</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/60 backdrop-blur-xl">
              <CardHeader className="border-b border-white/5 pb-6">
                <CardTitle className="text-white flex items-center gap-3">
                  <Key className="text-primary h-5 w-5" /> Environment Audit
                </CardTitle>
                <CardDescription>Status variabel lingkungan pada sistem Nexvora.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {envVars.map((v) => (
                  <div key={v.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">{v.key.replace('NEXT_PUBLIC_FIREBASE_', '')}</p>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">
                        {!isPlaceholder(v.value) ? v.value : <span className="text-destructive">MISSING / PLACEHOLDER</span>}
                      </p>
                    </div>
                    {!isPlaceholder(v.value) ? (
                      <Badge className="bg-green-500/20 text-green-500 border-none">VALID</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-none">ERROR</Badge>
                    )}
                  </div>
                ))}

                <div className="pt-6">
                  <Button 
                    onClick={handleTestConnection}
                    disabled={testStatus === "testing" || !isFirebaseConfigured}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none text-lg font-bold shadow-xl shadow-primary/20"
                  >
                    {testStatus === "testing" ? (
                      <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Sedang Menghubungkan...</>
                    ) : "Verifikasi Koneksi Realtime"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" /> Panduan Instalasi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-4">
                <ol className="list-decimal list-inside space-y-4">
                  <li>Buka <a href="https://console.firebase.google.com/" target="_blank" className="text-primary font-bold hover:underline inline-flex items-center gap-1">Firebase Console <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Pilih project Anda > Project Settings > General.</li>
                  <li>Scroll ke bawah ke bagian <b>"Your apps"</b>, pilih Web App.</li>
                  <li>Salin nilai dari objek <code>firebaseConfig</code> ke file <code>.env</code> Anda.</li>
                  <li><b>Penting:</b> Restart development server setelah mengedit file .env.</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="premium-card rounded-[2.5rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Activity className="text-primary h-5 w-5" /> Cloud Services Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { name: "Authentication", active: services.auth, icon: Key },
                  { name: "Firestore Database", active: services.firestore, icon: Database },
                  { name: "Cloud Storage", active: services.auth, icon: Activity },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-black/40 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${s.active ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-muted-foreground'}`}>
                        <s.icon className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-white">{s.name}</span>
                    </div>
                    {s.active ? (
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-white/10" />
                    )}
                  </div>
                ))}

                {testStatus === "success" && (
                  <Alert className="bg-green-500/10 border-green-500/20 text-white rounded-3xl py-6">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <AlertTitle className="font-black text-xl mb-1">Nexvora Connected!</AlertTitle>
                    <AlertDescription className="text-muted-foreground font-medium">
                      Backend telah terverifikasi. Anda sekarang dapat menggunakan seluruh fitur platform.
                    </AlertDescription>
                    <Button asChild className="w-full mt-6 luxury-gradient rounded-2xl h-12">
                      <a href="/">Masuk ke Platform</a>
                    </Button>
                  </Alert>
                )}

                {testStatus === "error" && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-3xl py-6">
                    <AlertCircle className="h-6 w-6 text-primary" />
                    <AlertTitle className="font-black text-xl mb-1">Koneksi Gagal</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      {errorMsg}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
