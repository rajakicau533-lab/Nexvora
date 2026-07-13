"use client"

import React, { useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Copy, 
  Users, 
  History, 
  Zap, 
  MessageCircle, 
  CheckCircle2, 
  Share2,
  Clock,
  Loader2,
  Coins,
  AlertCircle,
  Gift
} from "lucide-react"
import { useFirestore, useUser, useDoc, useCollection } from "@/firebase"
import { doc, collection, query, where, or, updateDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Sub-komponen untuk baris tabel referral agar bisa memantau saldo koin
 * user yang diundang secara individual dan realtime.
 */
function ReferralRow({ row, ownerEmail }: { row: any, ownerEmail: string }) {
  const db = useFirestore();
  
  // Listen real-time ke data user yang diundang untuk mendapatkan koin terbaru
  const referredUserRef = useMemo(() => (db && row.referredUserId ? doc(db, "users", row.referredUserId) : null), [db, row.referredUserId]);
  const { data: referredUser, loading: userLoading } = useDoc(referredUserRef);

  const coins = referredUser?.coins || 0;
  const isVerified = coins > 0;
  const isRewardSent = row.rewardSent === true;

  const handleClaim = () => {
    if (!isVerified || isRewardSent) return;

    const adminPhone = "6282131974325";
    const message = `Halo Admin Nexvora.\n\nSaya ingin mencairkan reward referral.\n\nEmail Referral Saya:\n${ownerEmail}\n\nUser Yang Saya Undang:\n${row.referredEmail || row.email}\n\nJumlah Koin User:\n${coins}\n\nMohon dilakukan pengecekan dan validasi reward referral saya.\n\nTerima kasih.`;
    
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02] h-16 md:h-20 transition-colors group">
      <TableCell className="px-4 md:px-8">
        <div className="flex flex-col">
          <span className="font-bold text-white text-[11px] md:text-sm truncate max-w-[100px] md:max-w-none">{row.referredUsername || row.username || "User"}</span>
          <span className="text-[8px] md:text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-2 w-2 md:h-2.5 md:w-2.5" /> {new Date(row.createdAt?.toDate?.() || 0).toLocaleDateString()}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 md:gap-2">
           <Coins className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
           <span className={cn("font-black text-[10px] md:text-xs", coins > 0 ? "text-primary" : "text-white/20")}>
             {userLoading ? "..." : coins}
           </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {userLoading ? (
          <Loader2 className="h-3 w-3 animate-spin ml-auto text-white/20" />
        ) : isRewardSent ? (
          <Badge className="bg-green-500/10 text-green-500 border-none text-[7px] md:text-[9px] font-black uppercase px-2 py-1 whitespace-nowrap">
            SUDAH DIKIRIM
          </Badge>
        ) : isVerified ? (
          <Badge className="bg-blue-500/10 text-blue-500 border-none text-[7px] md:text-[9px] font-black uppercase px-2 py-1 whitespace-nowrap">
            SIAP DIKLAIM
          </Badge>
        ) : (
          <Badge className="bg-amber-500/10 text-amber-500 border-none text-[7px] md:text-[9px] font-black uppercase px-2 py-1 whitespace-nowrap">
            VERIFIKASI PENDING
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right px-4 md:px-8">
        {isRewardSent ? (
          <div className="flex items-center justify-end text-[8px] md:text-[10px] text-green-500 font-black uppercase gap-1.5">
             <CheckCircle2 className="h-3 w-3" /> Reward 5 Koin Terkirim
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <Button 
                    onClick={handleClaim}
                    disabled={!isVerified || userLoading}
                    size="sm" 
                    variant="ghost" 
                    className={cn(
                      "rounded-lg border font-black text-[8px] md:text-[10px] uppercase h-7 md:h-9 transition-all px-2 md:px-3",
                      isVerified 
                        ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white group-hover:scale-105" 
                        : "border-white/5 bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    Klaim <MessageCircle className="ml-1 md:ml-2 h-2.5 w-2.5 md:h-3 md:w-3" />
                  </Button>
                </div>
              </TooltipTrigger>
              {!isVerified && !userLoading && (
                <TooltipContent className="bg-black border-white/10 text-white text-[10px]">
                  User belum aktivasi (saldo 0)
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function ReferralRewardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // 1. Fetch current user profile to get their unique referral code
  const userProfileRef = useMemo(() => (db && user?.uid ? doc(db, "users", user.uid) : null), [db, user?.uid])
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef)

  // 2. Auto-repair missing referral code
  useEffect(() => {
    if (profile && !profile.referralCode && db && user?.uid) {
      const generateNewCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCode = generateNewCode();
      const userRef = doc(db, "users", user.uid);
      
      updateDoc(userRef, {
        referralCode: newCode,
        updatedAt: serverTimestamp()
      }).then(() => {
        toast({ title: "Kode Referral Dibuat ✨", description: "Akun Anda kini memiliki kode referral unik." });
      }).catch(err => {
        console.error("Failed to generate missing referral code:", err);
      });
    }
  }, [profile, db, user?.uid, toast]);

  // 3. Fetch history: Persistent data directly from referral_history collection
  const invitedUsersQuery = useMemo(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "referral_history"), 
      or(
        where("referralOwnerId", "==", user.uid),
        where("ownerId", "==", user.uid),
        where("referrerId", "==", user.uid)
      )
    )
  }, [db, user?.uid])

  const { data: rawHistory, loading: historyLoading } = useCollection<any>(invitedUsersQuery)

  // 4. Process and sort history client-side for consistent ordering
  const history = useMemo(() => {
    if (!rawHistory) return []
    return [...rawHistory].sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      return timeB - timeA;
    });
  }, [rawHistory]);

  const copyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode)
      toast({ title: "Kode Disalin", description: `Kode ${profile.referralCode} telah disalin ke clipboard.` })
    }
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Sinkronisasi Database...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-3xl font-headline font-bold text-white flex items-center gap-3 tracking-tight">
            Referral Reward <Trophy className="text-primary h-5 w-5 md:h-8 md:w-8" />
          </h2>
          <p className="text-muted-foreground text-xs md:text-base max-w-xl">
            Sistem distribusi reward otomatis untuk member setia Nexvora Studio.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-[2rem] bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="pt-6 md:pt-10 text-center space-y-0">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-primary tracking-[0.2em] md:tracking-[0.3em] mb-2">Kode Unik Anda</p>
                <div 
                  onClick={copyReferralCode}
                  className="inline-flex items-center gap-2 md:gap-4 bg-white/5 border-white/10 px-5 py-3 md:px-8 md:py-5 rounded-xl md:rounded-2xl group cursor-pointer hover:border-primary/50 transition-all shadow-2xl"
                >
                   <span className="text-xl md:text-3xl font-headline font-black text-white tracking-widest uppercase">{profile?.referralCode || "---"}</span>
                   <Copy className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
             </CardHeader>
             <CardContent className="px-6 pb-6 md:px-8 md:pb-10 space-y-4 md:space-y-6">
                <Button 
                  onClick={copyReferralCode}
                  className="w-full h-11 md:h-14 rounded-xl luxury-gradient font-black text-[10px] md:text-base shadow-xl shadow-primary/20"
                >
                   <Share2 className="mr-2 h-3.5 w-3.5 md:h-5 md:w-5" /> Bagikan Kode
                </Button>

                <div className="p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                         <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <span className="text-[10px] md:text-sm font-bold text-white">Total Referral</span>
                   </div>
                   <span className="text-lg md:text-2xl font-headline font-black text-white">{historyLoading ? "..." : history.length}</span>
                </div>
             </CardContent>
          </Card>

          <Card className="premium-card rounded-[1.5rem] md:rounded-[2rem] bg-black/60 border-white/5">
             <CardHeader className="pb-3">
                <CardTitle className="text-[9px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2">
                   <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" /> Cara Pakai Referral
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3 md:space-y-4">
                {[
                  "Salin kode referral unik milik Anda di atas.",
                  "Bagikan kode kepada teman atau kolega Anda.",
                  "Teman memasukkan kode saat registrasi akun baru.",
                  "Setelah teman bergabung, data otomatis masuk ke history.",
                  "Status berubah SIAP DIKLAIM jika teman telah topup koin.",
                  "Klik 'Klaim' untuk konfirmasi ke Admin WhatsApp."
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 group">
                     <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/50 transition-colors">
                        <span className="text-[8px] md:text-[10px] font-bold text-white/40">{i+1}</span>
                     </div>
                     <p className="text-[10px] md:text-xs text-muted-foreground group-hover:text-white/80 transition-colors leading-relaxed">{step}</p>
                  </div>
                ))}
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-[1.5rem] md:rounded-[2.5rem] bg-black/40 border-white/5 overflow-hidden">
             <CardHeader className="py-4 px-5 md:py-6 md:px-8 border-b border-white/5 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-sm md:text-lg flex items-center gap-2 text-white">
                      <History className="h-4 w-4 md:h-5 md:w-5 text-primary" /> History Referral
                   </CardTitle>
                   <CardDescription className="text-[8px] md:text-xs mt-0.5">Seluruh rujukan yang terdeteksi di sistem kami.</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <Table>
                      <TableHeader className="bg-white/5">
                         <TableRow className="border-white/5 h-10 md:h-12">
                            <TableHead className="text-white font-bold text-[9px] md:text-xs uppercase px-4 md:px-8">User / Email</TableHead>
                            <TableHead className="text-white font-bold text-[9px] md:text-xs uppercase">Koin User</TableHead>
                            <TableHead className="text-white font-bold text-[9px] md:text-xs uppercase text-right">Status</TableHead>
                            <TableHead className="text-white font-bold text-[9px] md:text-xs uppercase text-right px-4 md:px-8">Action</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {historyLoading ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto h-6 w-6 text-primary" /></TableCell></TableRow>
                         ) : history.length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic text-[10px] md:text-xs">Belum ada teman yang bergabung.</TableCell></TableRow>
                         ) : (
                           history.map((row: any) => (
                             <ReferralRow key={row.id} row={row} ownerEmail={user?.email || ""} />
                           ))
                         )}
                      </TableBody>
                   </Table>
                </div>
             </CardContent>
          </Card>
          
          <div className="p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
             <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 md:h-6 md:w-6 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-xs md:text-sm font-bold text-white">Informasi Verifikasi</p>
                   <p className="text-[9px] md:text-[11px] text-muted-foreground leading-relaxed">
                      Referral dianggap valid dan dapat diklaim jika pengguna yang diundang telah melakukan pengisian koin (saldo &gt; 0). Sistem kami akan memvalidasi setiap klaim secara manual untuk mencegah penyalahgunaan.
                   </p>
                </div>
             </div>
             
             <div className="flex items-start gap-3 bg-white/[0.03] p-4 rounded-xl border border-white/5">
                <Gift className="h-4 w-4 md:h-6 md:w-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-xs md:text-sm font-bold text-amber-500">Reward Referral</p>
                   <p className="text-[9px] md:text-[11px] text-white/70 leading-relaxed font-medium">
                      Setiap 1 user yang berhasil diundang dan terverifikasi akan mendapatkan reward sebesar <span className="text-white font-bold">5 koin</span>. Reward dikirim langsung ke saldo akun Nexvora Anda oleh Admin.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
