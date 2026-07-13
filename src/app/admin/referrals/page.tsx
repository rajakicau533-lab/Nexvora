"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Search, 
  Loader2, 
  Clock, 
  TrendingUp, 
  UserCheck,
  Calendar,
  Zap,
  ChevronLeft,
  ChevronRight,
  Gift,
  CheckCircle2
} from "lucide-react"
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { sendReferralReward } from "@/lib/referral-reward-service"

const ITEMS_PER_PAGE = 15

/**
 * Individual row component to manage referred user coin checks and reward actions
 */
function AdminReferralRow({ row, adminUser }: { row: any, adminUser: any }) {
  const db = useFirestore()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch invited user's current coins to verify eligibility
  const referredUserRef = useMemo(() => (db && row.referredUserId ? doc(db, "users", row.referredUserId) : null), [db, row.referredUserId])
  const { data: referredUser } = useDoc(referredUserRef)
  
  const coins = referredUser?.coins || 0
  const isEligible = coins > 0 && !row.rewardSent

  const handleSendReward = async () => {
    if (!db || !adminUser || isProcessing) return
    if (!confirm(`Kirim 5 koin reward ke ${row.referralOwnerEmail || 'pengundang'}?`)) return

    setIsProcessing(true)
    try {
      await sendReferralReward(db, row.id, row.referralOwnerId, adminUser.email)
      toast({ title: "Reward Terkirim! 🎁", description: "5 koin telah ditambahkan ke saldo pengundang." })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02] h-20 transition-colors">
      <TableCell className="px-8">
        <div className="flex flex-col">
           <span className="font-bold text-white text-sm">{row.referredUsername || "User"}</span>
           <span className="text-[10px] text-muted-foreground">{row.referredEmail}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
           <span className="font-bold text-primary text-xs">{row.referralOwnerEmail || "Admin"}</span>
           <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">KODE: {row.referralCode}</span>
        </div>
      </TableCell>
      <TableCell>
         <div className="flex items-center gap-1.5">
            <span className={cn("font-bold text-xs", coins > 0 ? "text-green-500" : "text-white/20")}>{coins} 🪙</span>
         </div>
      </TableCell>
      <TableCell className="text-right">
        {row.rewardSent ? (
          <Badge className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase">SUDAH DIKIRIM</Badge>
        ) : coins > 0 ? (
          <Badge className="bg-blue-500/10 text-blue-500 border-none text-[9px] font-black uppercase animate-pulse">SIAP DIKLAIM</Badge>
        ) : (
          <Badge className="bg-amber-500/10 text-amber-500 border-none text-[9px] font-black uppercase">PENDING VERIF</Badge>
        )}
      </TableCell>
      <TableCell className="text-right px-8">
         <Button 
          onClick={handleSendReward}
          disabled={!isEligible || isProcessing}
          size="sm"
          className={cn(
            "rounded-xl font-bold text-[10px] uppercase h-9 shadow-lg transition-all",
            isEligible 
              ? "luxury-gradient border-none text-white shadow-primary/20 hover:scale-105" 
              : "bg-white/5 border border-white/10 text-white/20"
          )}
         >
           {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Gift className="h-3 w-3 mr-2" />}
           {row.rewardSent ? "Reward Terkirim" : "Kirim 5 Koin"}
         </Button>
      </TableCell>
    </TableRow>
  )
}

export default function AdminReferralManagementPage() {
  const db = useFirestore()
  const { user: adminUser } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setFilter] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)

  const referralQuery = useMemo(() => {
    if (!db) return null
    return query(collection(db, "referral_history"), orderBy("createdAt", "desc"))
  }, [db])

  const { data: referralLogs, loading } = useCollection<any>(referralQuery)

  const processedData = useMemo(() => {
    if (!referralLogs) return []

    return referralLogs.filter((log: any) => {
      const ownerEmail = (log.referralOwnerEmail || log.ownerEmail || log.referrerEmail || "").toLowerCase();
      const referredEmail = (log.referredEmail || log.email || "").toLowerCase();
      const referredUsername = (log.referredUsername || log.username || "").toLowerCase();
      const referralCode = (log.referralCode || "").toLowerCase();
      
      const matchesSearch = 
        referredEmail.includes(searchTerm.toLowerCase()) || 
        ownerEmail.includes(searchTerm.toLowerCase()) || 
        referredUsername.includes(searchTerm.toLowerCase()) ||
        referralCode.includes(searchTerm.toLowerCase())
      
      if (dateFilter === 0) return matchesSearch

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - dateFilter)
      const recordDate = log.createdAt?.toDate?.() || new Date(0)
      
      return matchesSearch && recordDate >= cutoff
    })
  }, [referralLogs, searchTerm, dateFilter])

  const paginatedData = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    return {
      totalInvited: referralLogs?.length || 0,
      totalRewarded: referralLogs?.filter(l => l.rewardSent).length || 0,
      recentInvited: referralLogs?.filter((log: any) => {
        const d = log.createdAt?.toDate?.() || new Date(0)
        return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }).length || 0
    }
  }, [referralLogs])

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight flex items-center gap-3">
            Referral Management <Users className="text-primary h-7 w-7" />
          </h2>
          <p className="text-muted-foreground text-sm">Validasi jaring undangan dan distribusi reward koin antar member.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card rounded-3xl border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Invited</p>
             <div className="p-2 rounded-xl bg-blue-500/10"><UserCheck className="h-4 w-4 text-blue-500" /></div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-headline font-black text-white">{stats.totalInvited.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="premium-card rounded-3xl border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reward Dikirim</p>
             <div className="p-2 rounded-xl bg-green-500/10"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-headline font-black text-white">{stats.totalRewarded.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="premium-card rounded-3xl border-white/5 bg-black/40 overflow-hidden">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Invited (Last 7 Days)</p>
             <div className="p-2 rounded-xl bg-primary/10"><TrendingUp className="h-4 w-4 text-primary" /></div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-headline font-black text-white">{stats.recentInvited.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari email pengundang, diundang, atau kode..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-white/5 border-white/10 rounded-xl h-12"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Semua', val: 0 },
                { label: 'Hari Ini', val: 1 },
                { label: '7 Hari', val: 7 },
                { label: '30 Hari', val: 30 },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => { setFilter(f.val); setCurrentPage(1); }}
                  className={cn(
                    "rounded-xl h-12 px-5 font-black uppercase text-[10px] tracking-widest transition-all border",
                    dateFilter === f.val 
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                      : "bg-black/40 border-white/10 text-white/40 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white font-bold text-xs uppercase px-8">User Diundang</TableHead>
                  <TableHead className="text-white font-bold text-xs uppercase">Pengundang / Kode</TableHead>
                  <TableHead className="text-white font-bold text-xs uppercase">Koin User</TableHead>
                  <TableHead className="text-white font-bold text-xs uppercase text-right">Status</TableHead>
                  <TableHead className="text-white font-bold text-xs uppercase text-right px-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Tidak ada riwayat referral ditemukan.</TableCell></TableRow>
                ) : (
                  paginatedData.map((row: any) => (
                    <AdminReferralRow key={row.id} row={row} adminUser={adminUser} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-8 border-t border-white/5">
              <p className="text-xs text-muted-foreground uppercase font-black">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl border-white/10 h-10 w-10"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl border-white/10 h-10 w-10"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
