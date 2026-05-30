
"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, Trash2, Loader2, Clock, ShieldCheck, User } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, limit, deleteDoc, doc, getDocs, where, Timestamp } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function AdminActivityLogPage() {
  const db = useFirestore()
  const { toast } = useToast()

  const logsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(100))
  }, [db])

  const { data: logs, loading } = useCollection<any>(logsQuery)

  const handleCleanup = async () => {
    if (!db) return
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    try {
      const q = query(collection(db, "activity_logs"), where("timestamp", "<", Timestamp.fromDate(threeDaysAgo)))
      const snapshot = await getDocs(q)
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      toast({ title: "Cleanup Success", description: `${snapshot.docs.length} old logs have been removed.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white">System Activity</h2>
          <p className="text-muted-foreground">Audit user interactions and system events.</p>
        </div>
        <Button onClick={handleCleanup} variant="outline" className="rounded-xl border-white/10 hover:bg-red-500/10 hover:text-red-500">
          <Trash2 className="mr-2 h-4 w-4" /> Purge Logs (&gt; 3 Days)
        </Button>
      </div>

      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">Event</TableHead>
              <TableHead className="text-white font-bold">Subject</TableHead>
              <TableHead className="text-white font-bold">Details</TableHead>
              <TableHead className="text-white font-bold">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
            ) : logs?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No recent activity recorded.</TableCell></TableRow>
            ) : logs?.map((log) => (
              <TableRow key={log.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <div className="flex items-center gap-2">
                    {log.type === 'admin' ? <ShieldCheck className="h-4 w-4 text-primary" /> : <Activity className="h-4 w-4 text-blue-500" />}
                    <span className="font-bold text-white">{log.action}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" /> {log.userEmail || log.userId?.slice(0, 8)}
                   </div>
                </TableCell>
                <TableCell>
                   <p className="text-xs text-muted-foreground italic max-w-xs truncate">{log.details}</p>
                </TableCell>
                <TableCell>
                   <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-black">
                      <Clock className="h-3 w-3" /> {new Date(log.timestamp?.toDate()).toLocaleString()}
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
