"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CreditCard, Landmark, Upload, Info, CheckCircle2, Copy, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BANK_DETAILS, COIN_PRICE_IDR } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

export default function TopUpPage() {
  const [amount, setAmount] = useState(10)
  const { toast } = useToast()
  const totalPrice = amount * COIN_PRICE_IDR

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Berhasil Disalin",
      description: "Nomor rekening telah disalin ke clipboard.",
    })
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Top Up Koin 🪙</h2>
        <p className="text-muted-foreground">Isi saldo koin Nexvora untuk mengakses layanan premium.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5">
            <CardHeader>
              <CardTitle>Pengajuan Top Up</CardTitle>
              <CardDescription>Masukkan jumlah koin yang ingin Anda beli.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Jumlah Koin</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="bg-white/5 border-white/10 h-14 text-2xl font-headline font-bold rounded-2xl pl-12"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">🪙</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Harga per Koin</span>
                  <span className="font-bold">Rp {COIN_PRICE_IDR.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg border-t border-white/5 pt-4">
                  <span className="font-headline font-bold">Total Pembayaran</span>
                  <span className="font-headline font-bold text-primary">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Upload Bukti Transfer</Label>
                <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-bold">Pilih File Bukti Transfer</p>
                  <p className="text-xs text-muted-foreground">Format: JPG, PNG, PDF (Max 5MB)</p>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20">
                Kirim Konfirmasi Top Up
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="premium-card rounded-3xl border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="text-primary h-5 w-5" /> Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Nama Bank</p>
                    <p className="text-xl font-headline font-bold text-white">{BANK_DETAILS.bank_name}</p>
                  </div>
                  <img src="https://placehold.co/80x30/1A1410/white?text=BRI" alt="BRI" className="rounded" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Nomor Rekening</p>
                    <div className="flex items-center justify-between gap-2 p-3 bg-white/5 rounded-xl border border-white/10 group">
                      <span className="text-lg font-headline font-bold text-primary tracking-widest">{BANK_DETAILS.account_number}</span>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(BANK_DETAILS.account_number)} className="hover:bg-primary/20 hover:text-primary transition-colors">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Atas Nama</p>
                    <p className="text-sm font-bold text-white uppercase">{BANK_DETAILS.account_holder}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Pastikan transfer nominal sesuai hingga digit terakhir.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Admin akan melakukan verifikasi manual dalam 5-15 menit.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Koin otomatis bertambah setelah status verifikasi 'Berhasil'.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card rounded-3xl border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Riwayat Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { amount: "100", status: "Berhasil", date: "Hari ini" },
                  { amount: "50", status: "Pending", date: "Kemarin" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 px-6">
                    <div>
                      <p className="font-bold">{item.amount} Koin</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.date}</p>
                    </div>
                    <Badge variant="outline" className={item.status === 'Berhasil' ? 'border-green-500/30 text-green-500' : 'border-amber-500/30 text-amber-500'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
