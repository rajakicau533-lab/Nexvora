
"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image as ImageIcon, Video, FileText, Wand2, RefreshCcw, Download, Sparkles, AlertCircle, Copy, FileUp, ShieldCheck, Activity } from "lucide-react"
import { generateImageFromText } from "@/ai/flows/generate-image-from-text-flow"
import { transformImageWithAI } from "@/ai/flows/transform-image-with-ai-flow"
import { generatePromptFromImage } from "@/ai/flows/generate-prompt-from-image-flow"
import { generateVideoFromImage } from "@/ai/flows/generate-video-from-image-flow"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, increment, collection, setDoc, serverTimestamp } from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const AI_COST = 1;

export default function CreatorAIPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [numImages, setNumImages] = useState(1)
  const [ratio, setRatio] = useState<any>("16:9")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [resultImages, setResultImages] = useState<{ url: string }[]>([])
  const [resultVideo, setResultVideo] = useState<string | null>(null)
  const [resultPrompt, setResultPrompt] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<"Online" | "Busy" | "Quota Habis">("Online")

  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran gambar adalah 2MB." })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => setUploadedImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const logAiError = (error: any) => {
    if (!db || !user) return;
    const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('limit');
    
    setDoc(doc(collection(db, "ai_error_logs")), {
      userId: user.uid,
      userEmail: user.email,
      tab: activeTab,
      errorMessage: error.message || "Unknown AI error",
      timestamp: serverTimestamp(),
      isQuotaExceeded: isQuotaError
    }).catch(() => {});
  }

  const handleGenerate = async () => {
    if (!db || !user?.uid || !profile) return
    
    if (profile.coins < AI_COST) {
      toast({
        variant: "destructive",
        title: "Koin Tidak Cukup",
        description: `Anda butuh ${AI_COST} koin untuk proses ini.`,
      })
      return
    }

    setIsGenerating(true)
    setResultImages([])
    setResultVideo(null)
    setResultPrompt(null)

    try {
      let result;
      
      if (activeTab === "text-to-image") {
        if (!prompt) throw new Error("Silakan masukkan deskripsi prompt.")
        result = await generateImageFromText({ prompt, aspectRatio: ratio, numImages })
        setResultImages(result.images)
      } 
      else if (activeTab === "image-to-image") {
        if (!uploadedImage || !prompt) throw new Error("Unggah gambar dan masukkan instruksi.")
        result = await transformImageWithAI({ imageDataUri: uploadedImage, prompt, aspectRatio: ratio })
        setResultImages([{ url: result.imageDataUri }])
      }
      else if (activeTab === "image-to-prompt") {
        if (!uploadedImage) throw new Error("Unggah gambar terlebih dahulu.")
        result = await generatePromptFromImage({ imageDataUri: uploadedImage })
        setResultPrompt(result.prompt)
      }
      else if (activeTab === "image-to-video") {
        if (!uploadedImage) throw new Error("Unggah gambar terlebih dahulu.")
        result = await generateVideoFromImage({ photoDataUri: uploadedImage, promptText: prompt, aspectRatio: ratio })
        setResultVideo(result.videoDataUri)
      }

      // 1. Deduct coins ONLY after guaranteed success
      const costAmount = -AI_COST;
      updateDoc(profileRef!, { 
        coins: increment(costAmount) 
      }).catch(() => {});

      // 2. Log transaction
      const txRef = doc(collection(db, "coin_transactions"));
      setDoc(txRef, {
        userId: user.uid,
        amount: costAmount,
        type: "purchase",
        description: `AI Creation: ${activeTab}`,
        createdAt: serverTimestamp()
      }).catch(() => {});

      toast({ title: "Proses Berhasil! 🎉", description: `1 Koin telah digunakan.` })
      setSystemStatus("Online")
    } catch (err: any) {
      console.error("AI Error:", err)
      logAiError(err);
      
      const isQuotaError = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit');
      
      if (isQuotaError) {
        setSystemStatus("Quota Habis")
        toast({ 
          variant: "destructive", 
          title: "Sistem AI Sibuk", 
          description: "Server AI sedang sibuk atau kuota harian telah habis. Silakan coba lagi beberapa saat atau hubungi admin." 
        })
      } else {
        toast({ 
          variant: "destructive", 
          title: "Gagal Menghasilkan", 
          description: "Terjadi gangguan pada mesin AI. Koin Anda tidak terpotong." 
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Link has been copied to clipboard." })
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
              Nexvora AI Studio <Sparkles className="text-primary h-6 w-6" />
            </h2>
            <Badge className={cn(
              "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
              systemStatus === 'Online' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/20 text-red-500 border-red-500/30'
            )}>
              <Activity className="h-3 w-3 mr-1.5" /> System: {systemStatus}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium">Kualitas Studio 4K dengan Biaya Terjangkau.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">🪙</div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground uppercase font-black">Sisa Saldo</p>
            <p className="text-lg font-headline font-bold text-white">{profile?.coins || 0} Koin</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-16 rounded-3xl shrink-0">
            <TabsTrigger value="text-to-image" className="rounded-2xl px-8 flex items-center gap-2 data-[state=active]:bg-primary h-full transition-all">
              <FileText className="h-4 w-4" /> Text To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-image" className="rounded-2xl px-8 flex items-center gap-2 data-[state=active]:bg-primary h-full transition-all">
              <ImageIcon className="h-4 w-4" /> Image To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-prompt" className="rounded-2xl px-8 flex items-center gap-2 data-[state=active]:bg-primary h-full transition-all">
              <RefreshCcw className="h-4 w-4" /> Image To Prompt
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="rounded-2xl px-8 flex items-center gap-2 data-[state=active]:bg-primary h-full transition-all">
              <Video className="h-4 w-4" /> Image To Video
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden">
              <CardHeader className="bg-white/5 py-4">
                <CardTitle className="text-md font-bold flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" /> Pengaturan AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <TabsContent value="text-to-image" className="m-0 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white font-bold ml-1">Deskripsi Visual</Label>
                    <Textarea 
                      placeholder="Jelaskan detail gambar yang ingin dibuat..." 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] focus:border-primary/50 text-white placeholder:text-white/20"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image-to-image" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-bold ml-1">Unggah Referensi</Label>
                    <div className="relative group">
                      <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="ai-upload-2" />
                      <label htmlFor="ai-upload-2" className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center bg-white/5 hover:bg-white/10 transition-all cursor-pointer block border-primary/20">
                        {uploadedImage ? (
                          <img src={uploadedImage} className="max-h-40 mx-auto rounded-xl object-contain shadow-2xl" alt="Uploaded" />
                        ) : (
                          <>
                            <FileUp className="h-10 w-10 text-primary mx-auto mb-4" />
                            <p className="text-sm font-bold text-white">Klik untuk Pilih Gambar</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-bold ml-1">Instruksi Ubah</Label>
                    <Input 
                      placeholder="Ubah gambar ini menjadi..." 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl h-12" 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image-to-prompt" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-bold ml-1">Unggah Gambar Analisis</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    <Alert className="bg-primary/5 border-primary/20 text-white rounded-2xl">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-xs">AI akan membongkar elemen gambar dan menjadikannya teks prompt.</AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>

                <TabsContent value="image-to-video" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-bold ml-1">Frame Awal Video</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-white/5 border-white/10 h-12 rounded-xl" />
                    <div className="space-y-2">
                      <Label className="text-white font-bold ml-1">Arah Gerakan (Opsional)</Label>
                      <Input 
                        placeholder="Contoh: Buat awan bergerak perlahan..." 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 rounded-xl" 
                      />
                    </div>
                  </div>
                </TabsContent>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-bold ml-1">Rasio</Label>
                    <Select value={ratio} onValueChange={setRatio}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                        <SelectValue />
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
                    <Label className="text-white font-bold ml-1">Hasil</Label>
                    <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Konten</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Biaya</span>
                    <span className="text-primary font-headline font-bold text-2xl">{AI_COST} Koin 🪙</span>
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || systemStatus === 'Quota Habis'}
                    className="w-full h-14 rounded-2xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </div>
                    ) : systemStatus === 'Quota Habis' ? (
                      "Kuota Harian Habis"
                    ) : (
                      <>
                        Proses Konten AI <Wand2 className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-8">
            <Card className="premium-card rounded-[2.5rem] border-white/5 min-h-[500px] flex flex-col bg-black/60 overflow-hidden relative shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md px-8">
                <div>
                  <CardTitle className="text-lg text-white">Nexvora Studio Canvas</CardTitle>
                  <CardDescription className="text-white/40">Hasil kreasi akan tampil secara instan di sini.</CardDescription>
                </div>
                {resultImages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(resultImages[0].url)} className="rounded-xl border-white/10 bg-white/5 text-primary hover:bg-primary/10">
                    <Copy className="h-4 w-4 mr-2" /> Share
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
                {isGenerating ? (
                  <div className="text-center space-y-8 animate-pulse">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-2xl font-headline font-bold text-white">Menghitung Piksel...</p>
                      <p className="text-muted-foreground">Nexvora Engine V2.5 sedang bekerja.</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {resultImages.length > 0 && (
                      <div className={cn("grid gap-4 w-full h-full", numImages > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                        {resultImages.map((img, i) => (
                          <div key={i} className="relative rounded-3xl overflow-hidden border border-white/10 group shadow-2xl bg-black/20">
                            <img src={img.url} className="w-full h-full object-contain max-h-[500px]" alt="AI Result" />
                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button asChild size="sm" className="luxury-gradient rounded-xl font-bold">
                                <a href={img.url} download={`nexvora-${i}.png`}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </a>
                              </Button>
                              <Button size="icon" variant="secondary" onClick={() => copyToClipboard(img.url)} className="rounded-xl bg-black/60 backdrop-blur-md">
                                <Copy className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {resultVideo && (
                      <div className="w-full max-w-2xl mx-auto space-y-4">
                        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                          <video controls className="w-full">
                            <source src={resultVideo} type="video/mp4" />
                          </video>
                        </div>
                        <div className="flex justify-center">
                          <Button asChild className="luxury-gradient rounded-xl px-8 font-bold">
                            <a href={resultVideo} download="nexvora-ai-video.mp4">
                              <Download className="mr-2 h-5 w-5" /> Download Video
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {resultPrompt && (
                      <div className="w-full max-w-xl p-10 rounded-[2.5rem] bg-white/5 border border-primary/20 text-center space-y-6 shadow-2xl">
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-4">
                          <p className="text-xs text-primary font-black uppercase tracking-[0.2em]">Prompt Terdeteksi</p>
                          <p className="text-xl italic text-white leading-relaxed font-medium">"{resultPrompt}"</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={() => { setPrompt(resultPrompt); setActiveTab("text-to-image"); }} className="luxury-gradient rounded-xl font-bold h-12 px-8">
                            Gunakan di Text To Image
                          </Button>
                          <Button onClick={() => copyToClipboard(resultPrompt)} variant="outline" className="rounded-xl border-white/10 h-12 px-8">
                            <Copy className="mr-2 h-4 w-4" /> Salin Teks
                          </Button>
                        </div>
                      </div>
                    )}

                    {!resultImages.length && !resultVideo && !resultPrompt && (
                      <div className="text-center space-y-8 opacity-40">
                        <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                          <Sparkles className="h-16 w-16 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-headline font-bold text-white uppercase tracking-widest">Canvas Kosong</p>
                          <p className="text-sm max-w-xs mx-auto text-muted-foreground font-medium">Isi parameter di sebelah kiri dan tekan tombol proses untuk memulai.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
