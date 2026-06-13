"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, CreditCard, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFirestore, useUser } from "@/firebase"
import { approveTopupRequest, rejectTopupRequest } from "@/lib/topup-management-service"
import { useToast } from "@/hooks/use-toast"

interface TableProps {
  data: any[]
}

const ITEMS_PER_PAGE = 10

export function TopupMonitorTable({ data }: TableProps) {
  const db = useFirestore()
  const { user: adminUser } = useUser()
  const { toast } = useToast()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const paginatedData = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleApprove = (item: any) => {
    if (!db || !adminUser) return
    setProcessingId(item.id)
    try {
      approveTopupRequest(db, item, adminUser)
      toast({ title: "Approved!", description: `Koin telah ditambahkan ke saldo ${item.userEmail}` })
    } finally {
      setTimeout(() => setProcessingId(null), 500)
    }
  }

  const handleReject = (item: any) => {
    if (!db || !adminUser) return
    setProcessingId(item.id)
    try {
      rejectTopupRequest(db, item, adminUser)
      toast({ title: "Rejected", description: "Permintaan topup telah ditolak." })
    } finally {
      setTimeout(() => setProcessingId(null), 500)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] overflow-hidden border border-white/5 bg-black/40">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5">
              <TableHead className="text-white font-bold text-xs uppercase">User / UID</TableHead>
              <TableHead className="text-white font-bold text-xs uppercase">Nominal</TableHead>
              <TableHead className="text-white font-bold text-xs uppercase">Koin</TableHead>
              <TableHead className="text-white font-bold text-xs uppercase">Status</TableHead>
              <TableHead className="text-white font-bold text-xs uppercase">Waktu</TableHead>
              <TableHead className="text-right text-white font-bold text-xs uppercase px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic">
                  Tidak ada data topup ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-white text-sm">{item.userEmail || "No Email"}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.userId?.slice(0, 12)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-primary">Rp {(item.idrAmount || 0).toLocaleString()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 text-primary font-black px-3 bg-primary/5">
                      {item.amountCoins} 🪙
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase px-2",
                      item.status === 'approved' ? 'bg-green-500' : 
                      item.status === 'rejected' ? 'bg-red-500' : 
                      'bg-amber-500'
                    )}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground uppercase font-bold">
                    {item.createdAt?.toDate?.().toLocaleDateString()} <br />
                    <span className="opacity-50">{item.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                       {item.status === 'pending' ? (
                         <>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={processingId === item.id}
                            onClick={() => handleApprove(item)}
                            className="h-8 w-8 text-green-500 hover:bg-green-500/10 rounded-lg"
                           >
                             {processingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                           </Button>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={processingId === item.id}
                            onClick={() => handleReject(item)}
                            className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-lg"
                           >
                             <XCircle className="h-4 w-4" />
                           </Button>
                         </>
                       ) : (
                         <span className="text-[9px] font-black text-white/20 uppercase mr-2 italic">Processed</span>
                       )}
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedProof(item.proofUrl)}
                        className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground uppercase font-black">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="rounded-xl border-white/10 h-10 w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="rounded-xl border-white/10 h-10 w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2rem] p-6 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Bukti Pembayaran
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 aspect-auto max-h-[70vh]">
            {selectedProof ? (
              <img src={selectedProof} className="w-full h-full object-contain" alt="Bukti Transfer" />
            ) : (
              <div className="p-20 text-center text-muted-foreground italic">Gambar tidak tersedia.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
