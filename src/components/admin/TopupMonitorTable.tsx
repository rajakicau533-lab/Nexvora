"use client"

import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ExternalLink, User, Calendar, CreditCard, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TableProps {
  data: any[]
}

const ITEMS_PER_PAGE = 10

export function TopupMonitorTable({ data }: TableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProof, setSelectedProof] = useState<string | null>(null)

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const paginatedData = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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
              <TableHead className="text-right text-white font-bold text-xs uppercase">Action</TableHead>
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
                <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-white text-sm">{item.userEmail || "No Email"}</span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.userId}</span>
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
                      "text-[9px] uppercase font-black px-2",
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
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedProof(item.proofUrl)}
                      className="text-primary hover:bg-primary/10 rounded-xl"
                    >
                      <Eye className="h-4 w-4 mr-2" /> Bukti
                    </Button>
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

      {/* Proof Modal */}
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
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setSelectedProof(null)} className="rounded-xl luxury-gradient font-bold px-8">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
