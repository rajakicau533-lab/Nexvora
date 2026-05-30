"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image as ImageIcon, Video, FileText, Wand2, RefreshCcw, Download, Sparkles, AlertCircle } from "lucide-react"
import { generateImageFromText } from "@/ai/flows/generate-image-from-text-flow"
import { transformImageWithAI } from "@/ai/flows/transform-image-with-ai-flow"
import { generatePromptFromImage } from "@/ai/flows/generate-prompt-from-image-flow"
import { generateVideoFromImage } from "@/ai/flows/generate-video-from-image-flow"
import { useToast } from "@/hooks/use-toast"
import { useUser, useFirestore, useDoc } from "@/firebase"
import { doc, updateDoc, increment, collection, setDoc, serverTimestamp } from "firebase/firestore"
import { Alert, AlertDescription } from "@/components/ui/alert"

const AI_COST = 5;

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

  // Fetch profile for coin validation
  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setUploadedImage(reader.result as string)
      reader.readAsDataURL(file)
    }
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

      // Deduct coins & Log
      await updateDoc(profileRef!, { coins: increment(-AI_COST) })
      await setDoc(doc(collection(db, "coin_transactions")), {
        userId: user.uid,
        amount: -AI_COST,
        type: "purchase",
        description: `AI Creation: ${activeTab}`,
        createdAt: serverTimestamp()
      })

      toast({ title: "Proses Berhasil! 🎉", description: "Karya AI Anda telah selesai dibuat." })
    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Gagal Menghasilkan", description: err.message })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
            Nexvora AI Studio <Sparkles className="text-primary h-6 w-6" />
          </h2>
          <p className="text-muted-foreground">Teknologi Nexvora Core V2.5 untuk hasil visual tanpa batas.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2">
          <span className="text-sm font-bold text-primary">Saldo: {profile?.coins || 0} Koin 🪙</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-14 rounded-2xl shrink-0">
            <TabsTrigger value="text-to-image" className="rounded-xl px-6 flex items-center gap-2 data-[state=active]:bg-primary">
              <FileText className="h-4 w-4" /> Text To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-image" className="rounded-xl px-6 flex items-center gap-2 data-[state=active]:bg-primary">
              <ImageIcon className="h-4 w-4" /> Image To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-prompt" className="rounded-xl px-6 flex items-center gap-2 data-[state=active]:bg-primary">
              <RefreshCcw className="h-4 w-4" /> Image To Prompt
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="rounded-xl px-6 flex items-center gap-2 data-[state=active]:bg-primary">
              <Video className="h-4 w-4" /> Image To Video
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="premium-card rounded-3xl border-white/5 bg-black/40">
              <CardHeader>
                <CardTitle className="text-lg">Konfigurasi AI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TabsContent value="text-to-image" className="m-0 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Prompt Deskripsi</Label>
                    <Textarea 
                      placeholder="Contoh: Seekor naga emas terbang di atas kota jakarta gaya cyberpunk 4k..." 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-2xl min-h-[120px] focus:border-primary/50"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image-to-image" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-bold">Unggah Referensi</Label>
                    <div className="relative group">
                      <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="ai-upload" />
                      <label htmlFor="ai-upload" className="border-2 border-dashed border-white/10 rounded-3xl p-8 text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer block">
                        {uploadedImage ? (
                          <img src={uploadedImage} className="max-h-40 mx-auto rounded-xl object-contain" alt="Uploaded" />
                        ) : (
                          <>
                            <ImageIcon className="h-10 w-10 text-primary mx-auto mb-4" />
                            <p className="text-sm font-bold">Klik untuk Unggah Gambar</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Instruksi Transformasi</Label>
                    <Input 
                      placeholder="Contoh: Ubah gaya gambar menjadi lukisan minyak..." 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl" 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image-to-prompt" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-bold">Unggah Gambar</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-white/5 border-white/10" />
                    <Alert className="bg-primary/5 border-primary/20">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-xs">AI akan menganalisis gambar dan membuat prompt deskripsi yang sempurna.</AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>

                <TabsContent value="image-to-video" className="m-0 space-y-6">
                  <div className="space-y-4">
                    <Label className="text-white font-bold">Unggah Gambar Awal</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-white/5 border-white/10" />
                    <div className="space-y-2">
                      <Label className="text-white font-bold">Panduan Gerakan (Opsional)</Label>
                      <Input 
                        placeholder="Contoh: Buat rambut karakter bergerak ditiup angin..." 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                  </div>
                </TabsContent>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-bold">Rasio</Label>
                    <Select value={ratio} onValueChange={setRatio}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
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
                    <Label className="text-white font-bold">Jumlah</Label>
                    <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
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

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground">Biaya Studio:</span>
                    <span className="text-primary font-headline font-bold text-xl">{AI_COST} Koin 🪙</span>
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
                        Proses Konten AI <Wand2 className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-7">
            <Card className="premium-card rounded-[2.5rem] border-white/5 h-full min-h-[500px] flex flex-col bg-black/40 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
                <div>
                  <CardTitle className="text-lg">Canvas AI</CardTitle>
                  <CardDescription>Hasil kreasi Nexvora akan muncul di sini.</CardDescription>
                </div>
                <Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/5 text-primary hover:bg-primary/10 transition-colors">
                  <Download className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-8 relative">
                {isGenerating ? (
                  <div className="text-center space-y-6 relative z-10">
                    <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto shadow-2xl shadow-primary/20" />
                    <div className="space-y-2">
                      <p className="text-xl font-headline font-bold text-white">Menghitung Jutaan Piksel...</p>
                      <p className="text-sm text-muted-foreground animate-pulse">Menghasilkan visual berkualitas tinggi untuk Anda.</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    {resultImages.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
                        {resultImages.map((img, i) => (
                          <div key={i} className="relative rounded-2xl overflow-hidden border border-white/10 group h-full">
                            <img src={img.url} className="w-full h-full object-cover" alt="AI Result" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button asChild size="sm" className="luxury-gradient rounded-xl font-bold">
                                <a href={img.url} download={`nexvora-ai-${i}.png`}>Download <Download className="ml-2 h-4 w-4" /></a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {resultVideo && (
                      <div className="w-full h-full flex flex-col gap-4">
                        <video controls className="w-full h-full rounded-3xl border border-white/10 shadow-2xl">
                          <source src={resultVideo} type="video/mp4" />
                        </video>
                      </div>
                    )}

                    {resultPrompt && (
                      <div className="w-full p-8 rounded-3xl bg-white/5 border border-primary/20 text-center space-y-4">
                        <p className="text-sm text-primary font-bold uppercase tracking-widest">Prompt Terdeteksi:</p>
                        <p className="text-xl italic text-white leading-relaxed">"{resultPrompt}"</p>
                        <Button onClick={() => { setPrompt(resultPrompt); setActiveTab("text-to-image"); }} variant="outline" className="rounded-xl border-primary/30 text-primary">
                          Gunakan untuk Teks ke Gambar
                        </Button>
                      </div>
                    )}

                    {!resultImages.length && !resultVideo && !resultPrompt && (
                      <div className="text-center space-y-4 opacity-40">
                        <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                          <Sparkles className="h-12 w-12 text-primary" />
                        </div>
                        <p className="text-lg font-bold">Canvas Masih Kosong</p>
                        <p className="text-sm max-w-xs">Tekan tombol 'Proses Konten' untuk memulai kreasi AI Anda.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Visual texture */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://picsum.photos/seed/texture/800/800')] mix-blend-overlay" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}