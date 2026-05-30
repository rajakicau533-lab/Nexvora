"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, ShieldCheck, Activity, Save, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { checkProviderBalance } from "@/ai/flows/process-traffic-order-flow"

export default function AdminSettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    provider: "IndoSMM",
    apiUrl: "",
    apiKey: "",
    serviceId: "",
    active: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [providerBalance, setProviderBalance] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  // Verify Super Admin status
  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  
  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  // Load from system_settings/provider_config
  const settingsRef = React.useMemo(() => {
    if (!db) return null
    return doc(db, "system_settings", "provider_config")
  }, [db])
  const { data: apiSettings, loading: settingsLoading } = useDoc(settingsRef)

  useEffect(() => {
    if (!adminLoading && adminData && adminData.role !== "super_admin" && user?.email !== "adheprogramer@gmail.com") {
      router.push("/admin")
      toast({ variant: "destructive", title: "Akses Ditolak", description: "Hanya Super Admin yang dapat mengakses pengaturan sistem." })
    }
  }, [adminData, adminLoading, router, toast, user?.email])

  useEffect(() => {
    if (apiSettings) {
      setFormData({
        provider: apiSettings.provider || "IndoSMM",
        apiUrl: apiSettings.apiUrl || "",
        apiKey: apiSettings.apiKey || "",
        serviceId: apiSettings.serviceId || "",
        active: apiSettings.active ?? true
      })
    }
  }, [apiSettings])

  const handleSave = async () => {
    if (!db) return
    setIsSaving(true)
    try {
      await setDoc(doc(db, "system_settings", "provider_config"), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      toast({ title: "Pengaturan Tersimpan", description: "Konfigurasi provider telah diperbarui di Firestore." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!formData.apiUrl || !formData.apiKey) {
      toast({ variant: "destructive", title: "Error", description: "Lengkapi URL dan API Key sebelum testing." })
      return
    }
    
    setIsTesting(true)
    setTestResult(null)
    setProviderBalance(null)
    setLastError(null)
    
    try {
      const result = await checkProviderBalance({
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey
      })
      
      if (result.success) {
        setTestResult("success")
        setProviderBalance(result.balance || "0")
        toast({ title: "Koneksi Berhasil", description: `Saldo Provider: ${result.balance} ${result.currency}` })
      } else {
        setTestResult("error")
        setLastError(result.error || "Gagal menghubungi provider")
        toast({ variant: "destructive", title: "Koneksi Gagal", description: result.error })
      }
    } catch (err: any) {
      setTestResult("error")
      setLastError(err.message || "Fetch failed")
      toast({ variant: "destructive", title: "Koneksi Gagal", description: err.message })
    } finally {
      setIsTesting(false)
    }
  }

  if (adminLoading || settingsLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3 text-white">
            System Settings <Settings className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground">Configure global endpoints for traffic booster services.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
           <ShieldCheck className="h-4 w-4 text-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white">Super Admin Access</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white font-bold">Provider Configuration</CardTitle>
              <CardDescription>Enter the API details from your SMM provider panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">Provider Name</Label>
                <Input 
                  placeholder="IndoSMM" 
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-6 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">API Endpoint URL</Label>
                <Input 
                  placeholder="https://indosmm.com/api/v2" 
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-6 focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">API Secret Key</Label>
                <Input 
                  type="password"
                  placeholder="••••••••••••••••" 
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-6 focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest">Default Service ID</Label>
                  <Input 
                    placeholder="8402" 
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-2xl h-14 text-white px-6 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center">
                  <Label className="text-white font-bold ml-1 uppercase text-xs tracking-widest mb-2">Service Status</Label>
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={formData.active} 
                      onCheckedChange={(v) => setFormData({...formData, active: v})} 
                    />
                    <span className="text-xs text-muted-foreground">{formData.active ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1 h-14 rounded-2xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20"
                >
                  {isSaving ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
                </Button>
                <Button 
                  onClick={handleTest} 
                  disabled={isTesting}
                  variant="outline"
                  className="h-14 rounded-2xl border-white/10 bg-white/5 px-8 hover:bg-white/10 text-white"
                >
                  {isTesting ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Test Input Config"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md text-white font-bold">
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
                      <p className="text-xl font-headline font-bold text-white uppercase">Connected</p>
                      <p className="text-2xl font-black text-primary">Rp {providerBalance}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Provider Balance</p>
                    </div>
                  </>
                ) : testResult === "error" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                      <AlertCircle className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-white uppercase tracking-tighter">Connection Failed</p>
                      <p className="text-[10px] text-red-400 font-bold uppercase mt-2 px-4 line-clamp-3">{lastError}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground border border-white/10">
                      <RefreshCw className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-muted-foreground uppercase tracking-widest">IDLE</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Lakukan test untuk cek API</p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                 <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Integration Guide</p>
                 <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2">• Key: Ditemukan di Panel Provider &gt; Settings.</li>
                    <li className="flex items-start gap-2">• URL: Harus berakhiran /api/v2</li>
                    <li className="flex items-start gap-2">• Pastikan domain provider dapat diakses server.</li>
                 </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
