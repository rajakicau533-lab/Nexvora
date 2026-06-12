"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle2, XCircle, Wallet, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsProps {
  data: any[]
}

export function TopupMonitorStats({ data }: StatsProps) {
  const stats = React.useMemo(() => {
    return {
      pending: data.filter(t => t.status === "pending").length,
      approved: data.filter(t => t.status === "approved").length,
      rejected: data.filter(t => t.status === "rejected").length,
      nominalPending: data
        .filter(t => t.status === "pending")
        .reduce((sum, t) => sum + (t.idrAmount || 0), 0)
    }
  }, [data])

  const items = [
    { label: "Total Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Nominal Pending", value: `Rp ${stats.nominalPending.toLocaleString()}`, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Card key={i} className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.label}</p>
             <div className={cn("p-1.5 rounded-lg", item.bg)}>
               <item.icon className={cn("h-3.5 w-3.5", item.color)} />
             </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl md:text-2xl font-headline font-black text-white">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
