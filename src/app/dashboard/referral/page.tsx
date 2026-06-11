"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Coins, 
  Trophy, 
  Copy, 
  History, 
  MessageCircle, 
  Gift, 
  Share2,
  Loader2,
  CheckCircle2,
  Zap
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase"
import { doc, collection, query, where, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const REWARD_PERCENTAGE = 0.20 // 20%
const ADMIN_WA = "628213197435"

export default function ReferralRewardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  // 1. Profil Pengguna
  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile, loading: profileLoading } = useDoc(profileRef)

  // 2. Daftar User yang Diundang
  const invitedUsersQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return query(collection(db, "users"), where("referredBy", "==", user.uid))
  }, [db, user?.uid])
  const { data: invitedUsers, loading: invitedLoading } = useCollection<any>(invitedUsersQuery)

  // 3. Transaksi Koin untuk Seluruh Referred Users
  const allInvitedIds = useMemo(() => invitedUsers?.map(u => u.uid) || [], [invitedUsers])
  
  const transactionsQuery = React.useMemo(() => {
    if (!db || allInvitedIds.length === 0) return null
    return query(collection(db, "coin_transactions"), where("userId", "in", allInvitedIds.slice(0, 30)))
  }, [db, allInvitedIds])
  const { data: transactions } = useCollection<any>(transactionsQuery)

  // 4. Perhitungan Statistik
  const stats = useMemo(() => {
    if (!invitedUsers || !transactions) return { totalUsers: 0, totalAdminCoins: 0, totalReward: 0, history: [] }

    const invitedStats = invitedUsers.map(u => {
      const userTransactions = transactions.filter(tx => 
        tx.userId === u.uid && 
        tx.amount > 0 && 
        tx.type === 'topup' &&
        (tx.description?.toLowerCase().includes('admin adjustment') || tx.description?.toLowerCase().includes('added by'))
      )
      
      const adminCoins = userTransactions.reduce((acc, tx) => acc + tx.amount, 0)
      const reward = Math.floor(adminCoins * REWARD_PERCENTAGE)

      return {
        username: u.username,
        joinedAt: u.createdAt?.toDate(),
        adminCoins,
        reward
      }
    })

    const totalAdminCoins = invitedStats.reduce((acc, s) => acc + s.adminCoins, 0)
    const totalReward = invitedStats.reduce((acc, s) => acc + s.reward, 0)

    return {
      totalUsers: invitedUsers.length,
      totalAdminCoins,
      totalReward,
      history: invitedStats.sort((a, b) => (b.joinedAt?.getTime() || 0) - (a.joinedAt?.getTime() || 0))
    }
  }, [invitedUsers, transactions])

  const referralLink = useMemo(() => {
    if (typeof window === 'undefined' || !profile?.referralCode) return ""
    const baseUrl = window.location.origin
    return `${baseUrl}/?ref=${profile.referralCode}`
  }, [profile])

  const copyLink = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    toast({ title: "Link Disalin!", description: "Bagikan ke teman Anda untuk mulai mendapatkan reward." })
  }

  const handleAjukanReward = () => {
    const message = `Halo Admin Nexvora,\n\nSaya ingin mengajukan reward referral.\n\n` +
                    `• Username: ${profile?.username}\n` +
                    `• Referral Link: ${referralLink}\n` +
                    `• Jumlah User Diundang: ${stats.totalUsers}\n` +
                    `• Total Koin Referral: ${stats.totalAdminCoins} 🪙\n` +
                    `• Total Reward Referral: ${stats.totalReward} 🪙\n\n` +
                    `Mohon dilakukan pengecekan dan pencairan reward. Terima kasih.`;
    
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleGenerateCode = async () => {
    if (!profileRef || profile?.referralCode) return
    setIsGenerating(true)
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      await updateDoc(profileRef, { referralCode: code })
      toast({ title: "Kode Dihasilkan", description: "Referral Link Anda kini aktif." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan koneksi." })
    } finally {
      setIsGenerating(false)
    }
  }

  if (profileLoading || invitedLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest text-[10px] uppercase">Loading Referral Network...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-[1200px] mx-auto pb-20 px-4 md:px-0">
      {/* Header Section */}
      <div className="space-y-2">
        <h2 className="text-3xl md:text-4xl font-headline font-bold text-white flex items-center gap-3">
          Referral Reward 🏆
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Undang teman dan dapatkan reward <span className="text-primary font-bold">20%</span> dari koin yang mereka peroleh.
        </p>
      </div>

      {/* Referral Link Box */}
      <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="py-6 px-8 border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <Share2 className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">Bagikan Peluang</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {!profile?.referralCode ? (
            <div className="text-center py-6 space-y-4">
              <p className="text-muted-foreground italic text-sm">Aktifkan sistem referral Anda untuk mendapatkan link unik.</p>
              <Button onClick={handleGenerateCode} disabled={isGenerating} className="luxury-gradient rounded-xl px-10 h-12 font-black shadow-lg shadow-primary/20">
                {isGenerating ? <Loader2 className="animate-spin" /> : "AKTIFKAN SEKARANG"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] ml-1">Referral Link Anda</p>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="flex-1 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center overflow-hidden">
                  <span className="text-primary font-bold truncate text-sm md:text-base break-all">
                    {referralLink}
                  </span>
                </div>
                <Button 
                  onClick={copyLink} 
                  className="h-12 md:h-14 px-8 rounded-2xl bg-white/10 hover:bg-primary transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Copy className="h-5 w-5" /> <span>SALIN LINK</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Teman Terdaftar", value: stats.totalUsers, unit: "Orang", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Total Koin Referral", value: stats.totalAdminCoins, unit: "🪙", icon: Coins, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Total Reward Referral", value: stats.totalReward, unit: "🪙", icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
        ].map((s, i) => (
          <Card key={i} className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden group hover:border-primary/30 transition-all duration-500">
            <CardContent className="p-8 space-y-4 text-center md:text-left">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto md:mx-0", s.bg)}>
                <s.icon className={cn("h-6 w-6", s.color)} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                <div className="text-3xl md:text-4xl font-headline font-black text-white">
                  {s.value} <span className="text-sm font-normal text-muted-foreground">{s.unit}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History Table */}
      <div className="space-y-6">
        <h3 className="text-xl font-headline font-bold flex items-center gap-3 text-white px-1">
          <History className="h-5 w-5 text-primary" /> Riwayat Referral
        </h3>
        <Card className="premium-card rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-white font-bold px-8 py-5 text-xs uppercase tracking-widest">Username</TableHead>
                  <TableHead className="text-white font-bold text-xs uppercase tracking-widest">Bergabung</TableHead>
                  <TableHead className="text-white font-bold text-xs uppercase tracking-widest">Total Koin</TableHead>
                  <TableHead className="text-right text-white font-bold px-8 text-xs uppercase tracking-widest">Reward Anda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center text-muted-foreground italic text-sm">
                      Belum ada referral yang terdaftar menggunakan link Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.history.map((row, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-bold text-white text-sm">{row.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{row.joinedAt?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="font-bold text-white text-sm">{row.adminCoins} 🪙</TableCell>
                      <TableCell className="text-right px-8 font-black text-primary text-sm">+{row.reward} 🪙</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Action Claim Box */}
      <Card className="premium-card rounded-[3rem] border-primary/20 bg-gradient-to-br from-primary/20 via-black to-black shadow-[0_0_50px_rgba(220,38,38,0.1)]">
        <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              <Zap className="h-3 w-3 fill-primary" /> Ready to Claim
            </div>
            <h3 className="text-2xl md:text-4xl font-headline font-bold text-white">Siap Cairkan Reward?</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Reward referral Anda telah diakumulasi. Klik tombol di samping untuk mengirimkan laporan klaim ke WhatsApp Admin kami untuk proses audit dan pencairan manual.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 w-full md:w-fit">
            <div className="text-center">
              <div className="text-5xl md:text-7xl font-headline font-black text-primary drop-shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                {stats.totalReward} <span className="text-xl md:text-2xl">🪙</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] mt-2">Saldo Reward Tersedia</p>
            </div>
            
            <Button 
              onClick={handleAjukanReward}
              disabled={stats.totalReward === 0}
              className="w-full md:w-[260px] h-16 rounded-[1.5rem] luxury-gradient font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 group transition-transform hover:scale-105 active:scale-95"
            >
              AJUKAN KLAIM <MessageCircle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Rules Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
        <div className="flex items-start gap-4">
           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5 text-primary" />
           </div>
           <div>
              <h4 className="font-bold text-white text-sm mb-1">Komisi Transparan</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Anda mendapatkan 20% dari koin yang diberikan Admin kepada referral Anda (melalui Top Up atau Penyesuaian).</p>
           </div>
        </div>
        <div className="flex items-start gap-4">
           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5 text-primary" />
           </div>
           <div>
              <h4 className="font-bold text-white text-sm mb-1">Audit Cepat</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Proses klaim reward akan diaudit oleh admin secara manual untuk memastikan keaslian transaksi sebelum ditambahkan ke saldo utama.</p>
           </div>
        </div>
      </div>
    </div>
  )
}
