"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LogIn, Sparkles, AlertCircle, ChevronLeft, ShieldAlert, MessageCircle } from "lucide-react"
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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State for activation dialog
  const [showActivationDialog, setShowActivationDialog] = useState(false)
  const [rejectedEmail, setRejectedEmail] = useState("")
  
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

  const handleContactAdmin = () => {
    const message = `Halo Admin, mohon aktifkan akun saya.\n\nEmail: ${rejectedEmail}\n\nSaya ingin akun saya diverifikasi agar dapat login ke Nexvora Studio.`;
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

      {/* Activation Blocked Dialog */}
      <Dialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <DialogContent className="bg-black/95 border-white/10 text-white rounded-[2.5rem] p-10 text-center max-w-md">
           <div className="space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl shadow-red-500/10">
                <ShieldAlert className="text-red-500 h-10 w-10" />
              </div>
              <div className="space-y-2">
                 <DialogTitle className="text-3xl font-headline font-bold text-white">Akun Belum Diaktifkan</DialogTitle>
                 <DialogDescription className="text-muted-foreground text-base leading-relaxed">
                   Maaf, akun Anda belum diaktifkan oleh Admin. Silakan hubungi Admin untuk proses verifikasi dan aktivasi akun Anda.
                 </DialogDescription>
              </div>
              <div className="pt-4 space-y-3">
                <Button 
                  onClick={handleContactAdmin}
                  className="w-full h-14 rounded-2xl bg-green-500 hover:bg-green-600 border-none font-black text-lg shadow-xl shadow-green-500/20 group"
                >
                  Hubungi Admin <MessageCircle className="ml-2 h-6 w-6 group-hover:scale-110 transition-transform" />
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
