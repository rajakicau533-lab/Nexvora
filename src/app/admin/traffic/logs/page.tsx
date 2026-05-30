"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Link as LinkIcon, Info, Loader2 } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function TrafficApiLogsPage() {
  const db = useFirestore()

  const logsQuery = React.useMemo(() => {
    if (!db) return null
    return query(collection(db, "traffic_orders"), orderBy("createdAt", "desc"), limit(50))
  }, [db])

  const { data: logs, loading } = useCollection<any>(logsQuery)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-headline font-bold text-white">Traffic API Audit</h2>
        <p className="text-muted-foreground">Detailed logs of IndoSMM API responses and order results.</p>
      </div>

      <Card className="premium-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold">User / Link</TableHead>
              <TableHead className="text-white font-bold">Provider Info</TableHead>
              <TableHead className="text-white font-bold">Status</TableHead>
              <TableHead className="text-white font-bold">Response Body</TableHead>
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
                      <LinkIcon className="h-3 w-3" /> {log.url}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-primary">ID: {log.providerOrderId || 'N/A'}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{log.platform} • {log.views} Views</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase",
                    log.status === 'processing' ? 'bg-blue-600' : 
                    log.status === 'completed' ? 'bg-green-500' : 
                    log.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                  )}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[250px] overflow-hidden">
                    <pre className="text-[9px] text-muted-foreground bg-black/20 p-2 rounded-lg font-mono truncate">
                      {JSON.stringify(log.providerResponse || { error: "No response body" })}
                    </pre>
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
