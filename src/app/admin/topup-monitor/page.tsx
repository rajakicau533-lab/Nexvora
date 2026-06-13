"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Wallet, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  ChevronDown 
} from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { TopupMonitorStats } from "@/components/admin/TopupMonitorStats"
import { TopupMonitorTable } from "@/components/admin/TopupMonitorTable"
import { cn } from "@/lib/utils"
import { cleanupTopupHistory } from "@/lib/topup-management-service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function TopupMonitorPage() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCleaning, setIsCleaning] = useState(false)

  const topupQuery = useMemo(() => {
    if (!db) return null
    return query(collection(db, "topup_requests"), orderBy("createdAt", "desc"), limit(200))
  }, [db])

  const { data: allTopups, loading } = useCollection<any>(topupQuery)

  const filteredData = useMemo(() => {
    if (!allTopups) return []
    return allTopups.filter(t => {
      const matchesSearch = 
        t.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || t.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [allTopups, searchTerm, statusFilter])

  const handleCleanup = async (type: 'approved' | 'rejected' | 'all') => {
    if (!db) return
    
    const message = type === 'all' 
      ? "Bersihkan seluruh riwayat (Approved & Rejected)? Status PENDING tidak akan dihapus."
      : `Bersihkan seluruh riwayat dengan status ${type.toUpperCase()}?`;

    if (!confirm(message)) return

    setIsCleaning(true)
    try {
      const deletedCount = await cleanupTopupHistory(db, type)
      toast({ title: "Berhasil!", description: `${deletedCount} riwayat telah dibersihkan.` })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    } finally {
      setIsCleaning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Connecting Topup Database...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            Topup Monitor <Wallet className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground text-sm">Pemantauan transaksi pengisian koin Nexvora secara terintegrasi.</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button 
                disabled={isCleaning}
                variant="outline" 
                className="rounded-xl border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 h-12 font-bold px-6"
               >
                 {isCleaning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                 BERSIHKAN HISTORY <ChevronDown className="ml-2 h-4 w-4" />
               </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white rounded-xl">
              <DropdownMenuItem onClick={() => handleCleanup('approved')} className="cursor-pointer hover:bg-primary/20">
                Bersihkan Approved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCleanup('rejected')} className="cursor-pointer hover:bg-primary/20">
                Bersihkan Rejected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCleanup('all')} className="cursor-pointer text-red-500 font-bold hover:bg-red-500/10">
                Bersihkan Semua (Kecuali Pending)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TopupMonitorStats data={allTopups || []} />

      <div className="grid gap-6">
        <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari email user, UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((f) => (
                  <Button
                    key={f}
                    variant={statusFilter === f ? "default" : "outline"}
                    onClick={() => setStatusFilter(f)}
                    className={cn(
                      "rounded-xl h-12 px-5 font-black uppercase text-[10px] tracking-widest transition-all",
                      statusFilter === f ? "bg-primary shadow-lg shadow-primary/20" : "bg-black/40 border-white/10"
                    )}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TopupMonitorTable data={filteredData} />
          </CardContent>
        </Card>
      </div>

      <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Informasi Admin</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gunakan tombol centang (Approve) untuk menambah koin otomatis ke saldo user, atau tombol silang (Reject) untuk menolak pengajuan. 
            Semua aksi akan dicatat secara permanen di log aktivitas sistem.
          </p>
        </div>
      </div>
    </div>
  )
}
