"use client"

import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  User, 
  Link as LinkIcon, 
  Info, 
  Loader2, 
  ServerCrash, 
  CheckCircle2, 
  Trash2, 
  Settings2, 
  Save, 
  RefreshCw 
} from "lucide-react"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { saveCleanupSettings, deleteOldLogs, countOldLogs } from "@/lib/log-cleanup-service"

export default function TrafficApiLogsPage() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isSaving, setIsSaving] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanupSettings, setCleanupSettings] = useState({
    enabled: false,
    intervalDays: 30
  })

  // Fetch current logs
  const logsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "api_logs"), orderBy("timestamp", "desc"), limit(50))
  }, [db])
  const { data: logs, loading } = useCollection<any>(logsQuery)

  // Fetch cleanup settings
  const settingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "log_cleanup_config") : null), [db])
  const { data: savedSettings, loading: settingsLoading } = useDoc(settingsRef)

  useEffect(() => {
    if (savedSettings) {
      setCleanupSettings({
        enabled: savedSettings.enabled ?? false,
        intervalDays: savedSettings.intervalDays ?? 30
      })
    }
  }, [savedSettings])

  const handleSaveSettings = async () => {
    if (!db) return
    setIsSaving(true)
    try {
      await saveCleanupSettings(db, cleanupSettings)
      toast({ title: "Settings Saved", description: "Log cleanup configuration updated." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualCleanup = async () => {
    if (!db) return
    if (!confirm(`Hapus seluruh log yang lebih tua dari ${cleanupSettings.intervalDays} hari?`)) return
    
    setIsCleaning(true)
    try {
      const deletedCount = await deleteOldLogs(db, cleanupSettings.intervalDays)
      toast({ 
        title: "Cleanup Complete", 
        description: `Successfully removed ${deletedCount} old logs from the system.` 
      })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Cleanup Failed", description: err.message })
    } finally {
      setIsCleaning(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white">Traffic API Audit</h2>
          <p className="text-muted-foreground">Technical logs of every API call attempt to SMM.ID.</p>
        </div>
      </div>

      {/* Cleanup Controls Card */}
      <Card className="premium-card rounded-[2rem] border-white/5 bg-black/40 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" /> Auto Cleanup Logs
          </CardTitle>
          <CardDescription className="text-xs">Configure automatic deletion of old activity logs to save storage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={cleanupSettings.enabled} 
                  onCheckedChange={(val) => setCleanupSettings(prev => ({ ...prev, enabled: val }))} 
                />
                <span className="text-sm font-bold text-white">{cleanupSettings.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground uppercase font-black">Retention:</span>
                <Select 
                  value={cleanupSettings.intervalDays.toString()} 
                  onValueChange={(val) => setCleanupSettings(prev => ({ ...prev, intervalDays: parseInt(val) }))}
                >
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 rounded-xl h-10">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 text-white">
                    <SelectItem value="7">Every 7 Days</SelectItem>
                    <SelectItem value="14">Every 14 Days</SelectItem>
                    <SelectItem value="30">Every 30 Days</SelectItem>
                    <SelectItem value="90">Every 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving || settingsLoading}
                className="flex-1 md:flex-none luxury-gradient h-10 px-6 rounded-xl font-bold text-xs"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Config
              </Button>
              <Button 
                onClick={handleManualCleanup} 
                disabled={isCleaning}
                variant="outline" 
                className="flex-1 md:flex-none border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 h-10 px-6 rounded-xl font-bold text-xs transition-all"
              >
                {isCleaning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Clean Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">User / Link</TableHead>
              <TableHead className="text-white font-bold">Request Info</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-white font-bold">Full Response / Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
            ) : logs?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No traffic logs recorded.</TableCell></TableRow>
            ) : logs?.map((log) => (
              <TableRow key={log.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                      <User className="h-3 w-3 text-primary" /> {log.userEmail || log.userId?.slice(0, 8)}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] truncate max-w-[200px]">
                      <LinkIcon className="h-3 w-3" /> {log.link}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-primary">{log.provider}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{log.quantity} Views • {new Date(log.timestamp?.toDate()).toLocaleTimeString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase",
                    log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  )}>
                    {log.status === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <ServerCrash className="h-3 w-3 mr-1" />}
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] overflow-hidden">
                    {log.errorMessage ? (
                      <p className="text-[10px] text-red-400 bg-red-400/5 p-2 rounded-lg border border-red-400/10 font-mono italic">
                        {log.errorMessage}
                      </p>
                    ) : (
                      <pre className="text-[9px] text-muted-foreground bg-black/20 p-2 rounded-lg font-mono truncate cursor-help" title={JSON.stringify(log.responseBody)}>
                        {JSON.stringify(log.responseBody)}
                      </pre>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
