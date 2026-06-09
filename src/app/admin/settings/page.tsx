"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, ShieldCheck, Activity, Save, RefreshCw, AlertCircle, CheckCircle2, Loader2, Info, Terminal } from "lucide-react"
import { useFirestore, useUser, useDoc } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { checkProviderBalance, getProviderServices } from "@/ai/flows/process-traffic-order-flow"

export default function AdminSettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    provider: "SMM.ID",
    apiUrl: "https://smm.id/api/v2",
    apiKey: "",
    serviceId: "",
    active: true
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [providerBalance, setProviderBalance] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [availableServices, setAvailableServices] = useState<any[] | null>(null)

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);
  
  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  const settingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
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
        provider: apiSettings.provider || "SMM.ID",
        apiUrl: apiSettings.apiUrl || "https://smm.id/api/v2",
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
      toast({ title: "Pengaturan Tersimpan", description: "Konfigurasi provider SMM.ID diperbarui." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!formData.apiUrl || !formData.apiKey) {
      toast({ variant: "destructive", title: "Error", description: "Lengkapi URL dan API Key." })
      return
    }
    
    setIsTesting(true)
    setTestResult(null)
    setDebugInfo(null)
    
    try {
      const result = await checkProviderBalance({
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey
      })
      
      if (result.success) {
        setTestResult("success")
        setProviderBalance(result.balance || "0")
        setDebugInfo(result.debugInfo)
        toast({ title: "Koneksi Berhasil", description: `Saldo: ${result.balance} ${result.currency}` })
      } else {
        setTestResult("error")
        setDebugInfo(result.debugInfo || result.error)
        toast({ variant: "destructive", title: "Koneksi Gagal", description: result.error })
      }
    } catch (err: any) {
      setTestResult("error")
      setDebugInfo(err.message)
    } finally {
      setIsTesting(false)
    }
  }

  const handleFetchServices = async () => {
    if (!formData.apiUrl || !formData.apiKey) return;
    setIsTesting(true);
    try {
      const result = await getProviderServices({ apiUrl: formData.apiUrl, apiKey: formData.apiKey });
      if (result.success) {
        setAvailableServices(result.services);
        toast({ title: "Data Services Ditarik", description: `Berhasil mendapatkan ${result.services?.length || 0} layanan.` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal ambil services", description: err.message });
    } finally {
      setIsTesting(false);
    }
  }

  if (adminLoading || settingsLoading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3 text-white">
            System Settings <Settings className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground">Manage API communication with SMM.ID provider.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg text-white font-bold">API Configuration (SMM.ID)</CardTitle>
              <CardDescription>Enter credentials exactly as they appear in your SMM.ID panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1">Provider URL</Label>
                <Input 
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1">API Key</Label>
                <Input 
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                  className="bg-white/5 border-white/10 rounded-2xl h-14"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-bold uppercase text-[10px] tracking-widest ml-1">Shopee Service ID</Label>
                  <Input 
                    placeholder="e.g. 8402" 
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-2xl h-14"
                  />
                </div>
                <div className="flex flex-col justify-center gap-2">
                   <Label className="text-white font-bold uppercase text-[10px] ml-1">Status</Label>
                   <div className="flex items-center gap-3">
                     <Switch checked={formData.active} onCheckedChange={(v) => setFormData({...formData, active: v})} />
                     <span className="text-xs text-muted-foreground">{formData.active ? 'ACTIVE' : 'OFFLINE'}</span>
                   </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-14 rounded-2xl luxury-gradient font-bold shadow-xl shadow-primary/20">
                  {isSaving ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Configuration</>}
                </Button>
                <Button onClick={handleTest} disabled={isTesting} variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 px-8">
                  {isTesting ? <RefreshCw className="h-5 w-5 animate-spin" /> : "Test Balance"}
                </Button>
                <Button onClick={handleFetchServices} disabled={isTesting} variant="ghost" className="h-14 rounded-2xl border border-dashed border-white/10 px-6">
                  <Terminal className="mr-2 h-4 w-4" /> Fetch Services
                </Button>
              </div>
            </CardContent>
          </Card>

          {debugInfo && (
            <Card className="border-primary/20 bg-primary/5 rounded-2xl overflow-hidden">
               <CardHeader className="py-3 bg-primary/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase text-white flex items-center gap-2">
                    <Info className="h-3 w-3" /> Raw Provider Response
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setDebugInfo(null)} className="h-6 text-[9px]">Clear</Button>
               </CardHeader>
               <CardContent className="p-4">
                  <pre className="text-[10px] font-mono text-primary-foreground/80 overflow-auto max-h-[300px] whitespace-pre-wrap">
                    {typeof debugInfo === 'object' ? JSON.stringify(debugInfo, null, 2) : debugInfo}
                  </pre>
               </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="premium-card rounded-[2.5rem] border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md text-white font-bold">
                <Activity className="h-5 w-5 text-primary" /> API Connectivity
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
                      <p className="text-2xl font-black text-primary">Rp {providerBalance}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Account Balance</p>
                    </div>
                  </>
                ) : testResult === "error" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/30">
                      <AlertCircle className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-white uppercase">FAILED</p>
                      <p className="text-[10px] text-red-400 font-bold uppercase mt-2 px-4 line-clamp-3 italic">Check Debug Output below</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground border border-white/10">
                      <RefreshCw className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-headline font-bold text-muted-foreground uppercase tracking-widest">IDLE</p>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Press Test to verify API</p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                 <p className="text-[10px] text-primary uppercase font-bold tracking-widest">SMM.ID Requirements</p>
                 <ul className="space-y-2 text-xs text-white/60">
                    <li className="flex items-start gap-2">• End-point must be: https://smm.id/api/v2</li>
                    <li className="flex items-start gap-2">• API Key: From Profile > Settings in SMM.ID</li>
                    <li className="flex items-start gap-2">• Method: POST with form-urlencoded</li>
                 </ul>
              </div>
            </CardContent>
          </Card>
          
          {availableServices && (
            <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 max-h-[300px] overflow-hidden">
               <CardHeader className="py-4 px-6 border-b border-white/5">
                 <CardTitle className="text-xs uppercase font-black text-white">Active Services List</CardTitle>
               </CardHeader>
               <div className="overflow-auto max-h-[240px] px-6 py-4 divide-y divide-white/5">
                 {availableServices.slice(0, 20).map((s, i) => (
                   <div key={i} className="py-2 flex justify-between gap-2">
                     <span className="text-[10px] text-muted-foreground">ID: {s.service}</span>
                     <span className="text-[10px] text-white font-bold truncate text-right">{s.name}</span>
                   </div>
                 ))}
               </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}