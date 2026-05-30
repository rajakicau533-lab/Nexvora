"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Cpu, Image as ImageIcon, Video, FileText, Wand2, RefreshCcw, Download, Sparkles } from "lucide-react"

export default function CreatorAIPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [numImages, setNumImages] = useState(1)
  const [ratio, setRatio] = useState("16:9")

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 3000)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold">Nexvora AI Studio 🎨</h2>
          <p className="text-muted-foreground">Ubah imajinasi Anda menjadi visual profesional dalam hitungan detik.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Model: Nexvora Core V2.5</span>
        </div>
      </div>

      <Tabs defaultValue="text-to-image" className="space-y-8">
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-14 rounded-2xl shrink-0">
            <TabsTrigger value="text-to-image" className="rounded-xl px-6 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Text To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-image" className="rounded-xl px-6 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Image To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-prompt" className="rounded-xl px-6 flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" /> Image To Prompt
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="rounded-xl px-6 flex items-center gap-2">
              <Video className="h-4 w-4" /> Image To Video
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="premium-card rounded-3xl border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Konfigurasi AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TabsContent value="text-to-image" className="m-0 space-y-6">
                  <div className="space-y-2">
                    <Label>Prompt Deskripsi</Label>
                    <Textarea 
                      placeholder="Contoh: Seekor kucing astronot di atas bulan dengan gaya cinematic 4k..." 
                      className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] focus:border-primary/50 transition-colors"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image-to-image" className="m-0 space-y-6">
                  <div className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <ImageIcon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <p className="text-sm font-bold">Klik untuk Unggah Gambar</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Instruksi Transformasi</Label>
                    <Input placeholder="Contoh: Ubah gaya gambar menjadi lukisan van gogh..." className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                </TabsContent>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rasio Gambar</Label>
                    <Select value={ratio} onValueChange={setRatio}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                        <SelectValue placeholder="Pilih Rasio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:5">4:5 (Portrait)</SelectItem>
                        <SelectItem value="16:9">16:9 (Cinema)</SelectItem>
                        <SelectItem value="9:16">9:16 (Story)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah (Max 6)</Label>
                    <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                        <SelectValue placeholder="Pilih Jumlah" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Gambar</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Biaya Generasi:</span>
                    <span className="text-primary font-headline font-bold">5 Koin 🪙</span>
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20 group"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sedang Mengolah...
                      </div>
                    ) : (
                      <>
                        Hasilkan Konten AI <Wand2 className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-7">
            <Card className="premium-card rounded-[2.5rem] border-white/5 h-full min-h-[500px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Canvas AI</CardTitle>
                  <CardDescription>Hasil kreasi Nexvora AI akan muncul di sini.</CardDescription>
                </div>
                <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5">
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center p-8 bg-black/40 rounded-b-[2.5rem] relative overflow-hidden">
                {isGenerating ? (
                  <div className="text-center space-y-6 relative z-10">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-xl font-headline font-bold text-white">Sedang Berpikir...</p>
                      <p className="text-sm text-muted-foreground animate-pulse">Menghitung jutaan piksel untuk Anda.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 opacity-40">
                    <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-lg font-bold">Belum Ada Hasil</p>
                    <p className="text-sm max-w-xs">Tekan tombol 'Hasilkan' untuk memulai proses kreasi AI.</p>
                  </div>
                )}
                
                {/* Visual texture */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://picsum.photos/seed/texture/800/800')] mix-blend-overlay" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
