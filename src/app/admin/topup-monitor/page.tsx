"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Wallet, Trash2, Filter, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, orderBy, deleteDoc, doc, writeBatch, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { TopupMonitorStats } from "@/components/admin/TopupMonitorStats"
import { TopupMonitorTable } from "@/components/admin/TopupMonitorTable"
import { cn } from "@/lib/utils"

export default function TopupMonitorPage() {
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCleaning, setIsCleaning] = useState(false)

  // Fetch from existing collection topup_requests
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

  const handleCleanup = async () => {
    if (!db || !allTopups) return
    
    const historyToDelete = allTopups.filter(t => 
      ["approved", "rejected", "expired"].includes(t.status)
    )

    if (historyToDelete.length === 0) {
      toast({ title: "History Clean", description: "Tidak ada riwayat yang perlu dibersihkan." })
      return
    }

    if (!confirm(`Hapus ${historyToDelete.length} riwayat topup yang sudah diproses? Status PENDING tidak akan dihapus.`)) return

    setIsCleaning(true)
    try {
      const batch = writeBatch(db)
      historyToDelete.forEach(item => {
        batch.delete(doc(db, "topup_requests", item.id))
      })
      await batch.commit()
      toast({ title: "Berhasil!", description: `${historyToDelete.length} riwayat telah dibersihkan.` })
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
           <Button 
            onClick={handleCleanup} 
            disabled={isCleaning}
            variant="outline" 
            className="rounded-xl border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-500 h-12 font-bold px-6"
           >
             {isCleaning ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
             BERSIHKAN HISTORY
           </Button>
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
            Halaman ini hanya bersifat monitoring. Seluruh data disinkronkan langsung dari koleksi pengajuan user. 
            Menghapus riwayat melalui tombol "Bersihkan History" tidak akan mempengaruhi saldo koin user yang sudah disetujui.
          </p>
        </div>
      </div>
    </div>
  )
}
