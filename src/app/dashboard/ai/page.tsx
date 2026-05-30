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

      const costAmount = -AI_COST;
      updateDoc(profileRef!, { 
        coins: increment(costAmount) 
      }).catch(() => {});

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
      logAiError(err);
      const isQuotaError = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('limit');
      if (isQuotaError) {
        setSystemStatus("Quota Habis")
        toast({ variant: "destructive", title: "Sistem AI Sibuk", description: "Server AI sedang sibuk atau kuota harian telah habis." })
      } else {
        toast({ variant: "destructive", title: "Gagal Menghasilkan", description: "Terjadi gangguan pada mesin AI." })
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
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2 text-white">
              Nexvora AI Studio <Sparkles className="text-primary h-5 w-5" />
            </h2>
            <Badge className={cn(
              "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest",
              systemStatus === 'Online' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            )}>
              {systemStatus}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Hasilkan konten visual 4K premium secara instan.</p>
        </div>
        <div className="bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-2xl flex items-center gap-3 backdrop-blur-xl">
          <div className="text-left leading-none">
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1">Saldo Tersedia</p>
            <p className="text-lg font-headline font-bold text-primary">{profile?.coins || 0} Koin 🪙</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-white/5 border border-white/10 p-1 h-14 rounded-2xl shrink-0">
            <TabsTrigger value="text-to-image" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-primary h-full">
              <FileText className="h-3.5 w-3.5 mr-2" /> Text To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-image" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-primary h-full">
              <ImageIcon className="h-3.5 w-3.5 mr-2" /> Image To Image
            </TabsTrigger>
            <TabsTrigger value="image-to-prompt" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-primary h-full">
              <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Image To Prompt
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-primary h-full">
              <Video className="h-3.5 w-3.5 mr-2" /> Image To Video
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="premium-card rounded-2xl border-white/5 bg-black/40 overflow-hidden shadow-2xl">
              <CardHeader className="bg-white/[0.02] py-4 px-6 border-b border-white/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" /> Konfigurasi AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <TabsContent value="text-to-image" className="m-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white text-xs font-bold ml-1">Deskripsi Visual</Label>
                    <Textarea 
                      placeholder="Contoh: Pemandangan cyberpunk di masa depan..." 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl min-h-[100px] text-sm"
                    />
                  </div>
                </TabsContent>

                {/* Common ratio selector for all tabs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-xs font-bold ml-1">Aspek Rasio</Label>
                    <Select value={ratio} onValueChange={setRatio}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="16:9">16:9 (Wide)</SelectItem>
                        <SelectItem value="9:16">9:16 (Story)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-xs font-bold ml-1">Kuantitas</Label>
                    <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 4].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} Hasil</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Biaya Proses</span>
                    <span className="text-primary font-bold text-lg">{AI_COST} Koin 🪙</span>
                  </div>
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating || systemStatus === 'Quota Habis'}
                    className="w-full h-12 rounded-xl luxury-gradient border-none font-bold text-sm shadow-lg shadow-primary/20"
                  >
                    {isGenerating ? (
                      <Activity className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    {isGenerating ? "Memproses..." : "Generate Sekarang"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="premium-card rounded-2xl border-white/5 min-h-[450px] flex flex-col bg-black/60 overflow-hidden relative shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/[0.01] px-6 py-4">
                <div>
                  <CardTitle className="text-sm text-white">Studio Canvas</CardTitle>
                  <CardDescription className="text-[10px]">Hasil kreasi AI tampil di sini.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
                {isGenerating ? (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin mx-auto" />
                    <p className="text-sm font-medium text-white/50">Menganalisis Prompt...</p>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    {resultImages.length > 0 && (
                      <div className={cn("grid gap-4", numImages > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {resultImages.map((img, i) => (
                          <div key={i} className="group relative rounded-xl overflow-hidden border border-white/5 bg-black/20">
                            <img src={img.url} className="w-full aspect-video object-cover" alt="AI Result" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <Button asChild size="sm" className="luxury-gradient rounded-lg text-xs">
                                <a href={img.url} download>Download</a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!resultImages.length && !resultVideo && !resultPrompt && (
                      <div className="text-center opacity-20 py-20">
                        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
                        <p className="text-sm font-bold uppercase tracking-[0.2em]">Canvas Kosong</p>
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