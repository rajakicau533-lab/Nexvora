"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LogIn, Sparkles, AlertCircle, ChevronLeft, ShieldAlert, MessageCircle, Landmark, Upload, CheckCircle2, X, Image as ImageIcon } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for activation dialog
  const [showActivationDialog, setShowActivationDialog] = useState(false)
  const [rejectedEmail, setRejectedEmail] = useState("")
  const [activationProof, setActivationProof] = useState<string | null>(null)
  const activationFileInputRef = useRef<HTMLInputElement>(null)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db) {
      setError("Gagal menghubungkan ke server Firebase.")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user
      
      // 1. Cek Verifikasi Email
      if (!user.emailVerified) {
        setError("Email Anda belum diverifikasi. Silakan cek inbox atau folder spam Anda.")
        await signOut(auth)
        setIsLoading(false)
        return
      }

      // 2. Cek Verifikasi Admin di Firestore
      const profileRef = doc(db, "users", user.uid)
      const profileSnap = await getDoc(profileRef)
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data()
        
        // Block if not verified by admin
        if (profileData.adminVerified === false) {
          setRejectedEmail(user.email || email)
          setShowActivationDialog(true)
          await signOut(auth)
          setIsLoading(false)
          return
        }

        // Sinkronisasi status emailVerified ke Firestore
        try {
          await updateDoc(profileRef, {
            emailVerified: true
          });
        } catch (syncErr) {
          console.warn("Gagal sinkron status verifikasi.", syncErr);
        }
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali di Nexvora Studio!",
      })
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login Error:", err)
      let displayError = "Email atau password tidak sesuai."
      if (err.code === 'auth/user-not-found') displayError = "Akun tidak ditemukan."
      else if (err.code === 'auth/wrong-password') displayError = "Password salah."
      else if (err.code === 'auth/too-many-requests') displayError = "Terlalu banyak percobaan. Coba lagi nanti."
      
      setError(displayError)
      setIsLoading(false)
    }
  }

  const handleActivationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match('image.*')) {
        toast({ variant: "destructive", title: "Format Salah", description: "Hanya file gambar (JPG, PNG) yang diizinkan." })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran adalah 5MB." })
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setActivationProof(reader.result as string)
        toast({ title: "Bukti Terpilih", description: "Silakan hubungi admin untuk aktivasi." })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleContactAdmin = () => {
    if (!activationProof) {
      toast({ variant: "destructive", title: "Gagal", description: "Silakan upload bukti transfer terlebih dahulu." })
      return
    }

    const message = `Halo Admin,\n\nSaya telah melakukan transfer aktivasi akun Nexvora sebesar Rp30.000 untuk 10 koin.\n\nEmail Akun:\n${rejectedEmail}\n\nMohon dilakukan verifikasi dan aktivasi akun.\n\nTerima kasih.`;
    const whatsappUrl = `https://wa.me/6282131974325?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full translate-y-1/2 translate-x-1/2" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 transition-transform">
              <Sparkles className="text-white h-8 w-8" />
            </div>
            <span className="text-4xl font-headline font-bold text-white tracking-tight">Nexvora</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-white">Login Member</h1>
            <p className="text-muted-foreground font-medium">Masuk untuk mengelola layanan digital Anda.</p>
          </div>
        </div>

        <Card className="premium-card rounded-[2.5rem] border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <CardContent className="pt-10 space-y-6">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-2xl py-4">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-black ml-1 uppercase">Email Pengguna</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="anda@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" title="password" className="text-white text-sm font-black uppercase">Password</Label>
                  <Link href="#" className="text-xs text-primary font-black hover:text-primary/80 transition-colors uppercase tracking-widest">Lupa?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/30 mt-4 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Memverifikasi...
                  </div>
                ) : (
                  <>Masuk Sekarang <LogIn className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-10">
            <p className="text-sm text-muted-foreground font-medium">
              Belum punya akun? <Link href="/auth/register" className="text-primary font-black hover:underline hover:text-primary/80">Daftar Sekarang</Link>
            </p>
            <Link href="/" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-white transition-colors font-bold uppercase tracking-widest">
              <ChevronLeft className="h-3 w-3" /> Kembali ke Beranda
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Activation Blocked Dialog - Updated Flow */}
      <Dialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-8 md:p-10 max-w-lg overflow-y-auto max-h-[90vh]">
           <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl shadow-primary/10">
                  <ShieldAlert className="text-primary h-8 w-8" />
                </div>
                <DialogTitle className="text-2xl font-headline font-bold text-white">Verifikasi Aktivasi Akun</DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                  Untuk aktivasi akun, silakan melakukan pengisian 10 koin seharga <span className="text-white font-bold">Rp30.000</span>. Koin akan masuk ke akun Anda setelah verifikasi berhasil dilakukan.
                </DialogDescription>
              </div>

              {/* Payment Details Card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                 <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/70">Metode Pembayaran</span>
                 </div>
                 <div className="space-y-2 pl-8 border-l border-primary/30">
                    <p className="text-lg font-headline font-bold text-white tracking-tight">Bank BRI</p>
                    <div className="space-y-0.5">
                       <p className="text-xl font-headline font-black text-primary tracking-widest">676201000757500</p>
                       <p className="text-xs text-muted-foreground font-bold uppercase">A.N. THOMAS ADE PRABOWO</p>
                    </div>
                 </div>
              </div>

              {/* Upload Form */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Upload Bukti Transfer (WAJIB)</Label>
                
                {activationProof ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 group">
                    <img src={activationProof} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button variant="destructive" size="sm" onClick={() => setActivationProof(null)} className="rounded-xl font-bold">
                         <X className="h-4 w-4 mr-2" /> Ganti Gambar
                       </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                       <Badge className="bg-green-500 text-white border-none"><CheckCircle2 className="h-3 w-3 mr-1" /> File Terpilih</Badge>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => activationFileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/[0.02] hover:bg-white/5 hover:border-primary/50 transition-all cursor-pointer group flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Pilih Bukti Transfer</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">JPG, PNG • MAKS 5MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={activationFileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleActivationFileChange}
                />
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  onClick={handleContactAdmin}
                  disabled={!activationProof}
                  className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/20 group disabled:opacity-50 disabled:grayscale"
                >
                  {activationProof ? (
                    <>Kirim Konfirmasi <MessageCircle className="ml-2 h-6 w-6 group-hover:scale-110 transition-transform" /></>
                  ) : (
                    "Upload Bukti Dahulu"
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowActivationDialog(false)}
                  className="w-full h-12 rounded-2xl text-muted-foreground hover:text-white hover:bg-white/5 font-bold"
                >
                  Tutup
                </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
