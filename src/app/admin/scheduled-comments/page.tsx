"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlarmClock, 
  Loader2, 
  Trash2, 
  XCircle, 
  ExternalLink, 
  User, 
  MessageSquare,
  AlertCircle,
  Play,
  Server,
  FileText,
  Clock
} from "lucide-react"
import { useFirestore, useCollection, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { cancelScheduledComment, deleteScheduledRecord, executeScheduledComment } from "@/lib/scheduled-comment-service"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

export default function AdminScheduledCommentsPage() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // API Config
  const apiSettingsRef = React.useMemo(() => (db ? doc(db, "system_settings", "provider_config") : null), [db])
  const { data: apiSettings } = useDoc(apiSettingsRef)

  // Scheduled Comments List
  const scheduleQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "scheduled_comments"), orderBy("scheduledTimestamp", "desc"), limit(50))
  }, [db])
  const { data: list, loading } = useCollection<any>(scheduleQuery)

  // Audit Logs for Scheduler
  const logsQuery = React.useMemo(() => {
    if (!db) return null
    return query(
      collection(db, "api_logs"), 
      where("provider", "==", "SMM.ID (SCHEDULER)"),
      orderBy("timestamp", "desc"), 
      limit(10)
    )
  }, [db])
  const { data: auditLogs } = useCollection<any>(logsQuery)

  const handleTriggerServer = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/scheduler/execute');
      const data = await res.json();
      if (data.success) {
        toast({ title: "Sync Berhasil", description: `${data.processed} tugas diproses.` });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Server Error", description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExecuteManual = async (item: any) => {
    if (!db || !apiSettings) return;
    setExecutingId(item.id);
    try {
      const res = await executeScheduledComment(db, item.id, item, {
        apiUrl: apiSettings.apiUrl,
        apiKey: apiSettings.apiKey
      });
      if (res.success) toast({ title: "Berhasil Dikirim" });
      else toast({ variant: "destructive", title: "Gagal", description: res.error });
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white flex items-center gap-3">
            Scheduled Comments <AlarmClock className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground text-sm">Monitoring antrean eksekusi server-side.</p>
        </div>
        <Button 
          onClick={handleTriggerServer} 
          disabled={isSyncing}
          className="h-12 bg-primary/10 border border-primary/20 text-primary font-bold px-6 rounded-xl hover:bg-primary/20"
        >
          {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <Server className="mr-2 h-4 w-4" />}
          TRIGGER BACKEND SYNC
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white font-bold py-5">User / Target</TableHead>
                  <TableHead className="text-white font-bold">Jadwal</TableHead>
                  <TableHead className="text-white font-bold">Status</TableHead>
                  <TableHead className="text-right text-white font-bold px-8">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : list?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-sm">Tidak ada jadwal ditemukan.</TableCell></TableRow>
                ) : list?.map((item) => (
                  <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <p className="text-sm font-bold text-white">{item.userEmail}</p>
                      <a href={item.videoLink} target="_blank" className="text-[10px] text-muted-foreground truncate max-w-[150px] block hover:text-primary">
                        {item.videoLink}
                      </a>
                    </TableCell>
                    <TableCell>
                       <p className="text-[10px] text-white/60">{item.scheduledTimestamp?.toDate().toLocaleDateString()}</p>
                       <p className="text-xs font-bold text-primary">{item.scheduledTimestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    </TableCell>
                    <TableCell>
                       <Badge className={cn(
                          "text-[9px] font-black uppercase",
                          item.status === 'scheduled' ? 'bg-amber-500' :
                          item.status === 'processing' ? 'bg-blue-600 animate-pulse' :
                          item.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                       )}>
                         {item.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                       <div className="flex justify-end gap-2">
                          {(item.status === 'scheduled' || item.status === 'failed') && (
                            <Button size="icon" variant="ghost" onClick={() => handleExecuteManual(item)} disabled={executingId === item.id} className="h-8 w-8 text-green-500">
                              {executingId === item.id ? <Loader2 className="animate-spin" /> : <Play className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteScheduledRecord(db!, item.id)} className="h-8 w-8 text-white/20 hover:text-red-500">
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <CardTitle className="text-xs font-black uppercase text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" /> Scheduler Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                 {!auditLogs || auditLogs.length === 0 ? (
                   <p className="p-10 text-center text-xs text-muted-foreground italic">No logs recorded yet.</p>
                 ) : auditLogs.map((log: any) => (
                   <div key={log.id} className="p-4 space-y-2 hover:bg-white/[0.02]">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className={cn("text-[8px] uppercase", log.status === 'success' ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20')}>
                          {log.status}
                        </Badge>
                        <span className="text-[9px] text-white/40 font-mono">
                          {log.timestamp?.toDate().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/80 font-bold truncate">Ref: {log.scheduledCommentId?.slice(-6).toUpperCase()}</p>
                      {log.errorMessage && <p className="text-[9px] text-red-400 bg-red-400/5 p-1.5 rounded-lg border border-red-400/10 italic">{log.errorMessage}</p>}
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
             <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase">CRON Configuration</span>
             </div>
             <p className="text-[10px] text-muted-foreground leading-relaxed">
               Agar sistem berjalan 24 jam, gunakan layanan CRON (seperti <strong>EasyCron</strong> atau <strong>Cron-job.org</strong>) untuk menembak URL berikut setiap 1 menit:
               <code className="block mt-2 p-2 bg-black/40 rounded border border-white/5 text-primary break-all">
                 https://{typeof window !== 'undefined' ? window.location.hostname : 'your-domain'}/api/scheduler/execute
               </code>
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
