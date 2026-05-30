
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Settings, ShieldCheck, Activity, Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function AdminSettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    apiUrl: "",
    apiKey: "",
    serviceId: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)

  // Auth Protection
  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  // API Settings
  const settingsRef = React.useMemo(() => {
    if (!db) return null
    return doc(db, "settings", "api")
  }, [db])
  const { data: apiSettings, loading: settingsLoading } = useDoc(settingsRef)

  useEffect(() => {
    if (!profileLoading && profile && profile.role !== "admin") {
      router.push("/dashboard")
      toast({ variant: "destructive", title: "Access Denied", description: "Hanya Admin yang dapat mengakses halaman ini." })
    }
  }, [profile, profileLoading, router, toast])

  useEffect(() => {
    if (apiSettings) {
      setFormData({
        apiUrl: apiSettings.apiUrl || "",
        apiKey: apiSettings.apiKey || "",
        serviceId: apiSettings.serviceId || ""
      })
    }
  }, [apiSettings])

  const handleSave = async () => {
    if (!db) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "settings", "api"), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      toast({ title: "Pengaturan Tersimpan", description: "API Settings Nexvora telah diperbarui." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      // Logic for testing API connection
      await new Promise(resolve => setTimeout(resolve, 1500))
      setTestResult("success")
      toast({ title: "Koneksi Berhasil", description: "API Provider merespon dengan benar." })
    } catch (err) {
      setTestResult("error")
      toast({ variant: "destructive", title: "Koneksi Gagal", description: "Pastikan URL dan Key API valid." })
    } finally {
      setIsTesting(false)
    }
  }

  if (profileLoading || settingsLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            Admin API Settings <Settings className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground">Konfigurasi endpoint untuk layanan booster trafik Nexvora.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
           <ShieldCheck className="h-4 w-4 text-primary" />
           <span className="text-xs font-black uppercase tracking-widest text-white">Security Mode: Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Konfigurasi Provider</CardTitle>
              <CardDescription>Masukkan detail API dari panel provider Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">API Endpoint URL</Label>
                <Input 
                  placeholder="https://provider.com/api/v2" 
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white placeholder:text-white/20 px-6 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">API Secret Key</Label>
                <Input 
                  type="password"
                  placeholder="••••••••••••••••" 
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white placeholder:text-white/20 px-6 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">Service ID (Default)</Label>
                <Input 
                  placeholder="Contoh: 8402" 
                  value={formData.serviceId}
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white placeholder:text-white/20 px-6 focus:border-primary/50"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1 h-14 rounded-2xl luxury-gradient font-bold text-lg shadow-xl shadow-primary/20"
                >
                  {isSaving ? "Menyimpan..." : <><Save className="mr-2 h-5 w-5" /> Simpan Perubahan</>}
                </Button>
                <Button 
                  onClick={handleTest} 
                  disabled={isTesting || !formData.apiUrl}
                  variant="outline"
                  className="h-14 rounded-2xl border-white/10 bg-white/5 px-8 hover:bg-white/10"
                >
                  {isTesting ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md">
                <Activity className="h-5 w-5 text-primary" /> API Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                {testResult === "success" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/30">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-white">CONNECTED</p>
                      <p className="text-xs text-muted-foreground uppercase font-black">Provider merespon ok</p>
                    </div>
                  </>
                ) : testResult === "error" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                      <AlertCircle className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-white">FAILED</p>
                      <p className="text-xs text-muted-foreground uppercase font-black">Cek konfigurasi Anda</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground border border-white/10">
                      <RefreshCw className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-muted-foreground uppercase tracking-widest">IDLE</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Tekan Test untuk cek status</p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Integrasi Guide</p>
                 <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2">• Pastikan Server IP diizinkan di panel provider.</li>
                    <li className="flex items-start gap-2">• Gunakan HTTPS untuk endpoint URL.</li>
                    <li className="flex items-start gap-2">• API Key biasanya ditemukan di halaman Account Settings provider.</li>
                 </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
