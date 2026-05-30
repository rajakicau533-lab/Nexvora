"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus, Sparkles, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { isFirebaseConfigured } from "@/firebase/config"
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth"
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("Konfigurasi Firebase tidak valid. Harap selesaikan pengaturan di halaman /setup.")
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirebaseConfigured || !auth || !db) {
      router.push("/setup")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      // 1. Validasi Username Unik
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", username.toLowerCase().trim()))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        throw new Error("Username sudah digunakan oleh pengguna lain.")
      }

      // 2. Buat Akun di Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user

      // 3. Simpan Profil di Firestore
      const generatedReferral = "NXV" + Math.floor(1000 + Math.random() * 9000)
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        coins: 0,
        status: "active",
        role: "user",
        referralCode: generatedReferral,
        referredBy: referralCode.trim() || null,
        createdAt: serverTimestamp(),
      })

      // 4. Kirim Link Verifikasi (Sesuai Standar Firebase)
      await sendEmailVerification(user)
      
      // 5. Keluar paksa agar user harus login setelah verifikasi
      await signOut(auth)

      setIsSuccess(true)
      toast({
        title: "Pendaftaran Berhasil! 🎉",
        description: "Silakan verifikasi email Anda sebelum login.",
      })
    } catch (err: any) {
      console.error(err)
      let msg = "Gagal mendaftar. Periksa kembali data Anda."
      if (err.code === 'auth/invalid-api-key') msg = "API Key Firebase tidak valid. Periksa file .env Anda."
      if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar. Gunakan email lain."
      setError(err.message || msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
        <Card className="premium-card max-w-md w-full rounded-[2.5rem] p-10 text-center space-y-6 border-primary/20 bg-black/60 backdrop-blur-xl">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-headline font-bold text-white">Cek Email Anda</h2>
            <p className="text-muted-foreground leading-relaxed">
              Link verifikasi telah dikirim ke <span className="text-white font-bold">{email}</span>. 
              Mohon klik link tersebut untuk mengaktifkan akun Anda.
            </p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl luxury-gradient font-bold text-lg shadow-xl shadow-primary/20">
            <Link href="/auth/login">Lanjut ke Login</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 transition-transform">
              <Sparkles className="text-white h-8 w-8" />
            </div>
            <span className="text-4xl font-headline font-bold text-white tracking-tight">Nexvora</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold text-white">Buat Akun Kreator</h1>
            <p className="text-muted-foreground font-medium">Mulailah perjalanan digital Anda hari ini.</p>
          </div>
        </div>

        <Card className="premium-card rounded-[2.5rem] border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50">
          <CardContent className="pt-10 space-y-6">
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-2xl py-4">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-sm font-bold ml-1">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Contoh: nexvora_user" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/30 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-bold ml-1">Alamat Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/30 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="Minimal 8 karakter" className="text-white text-sm font-bold ml-1">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Min. 8 Karakter" 
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/30 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral" className="text-white text-sm font-bold ml-1">Kode Referral (Opsional)</Label>
                <Input 
                  id="referral" 
                  placeholder="Kode dari teman" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/30 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !!error && !isFirebaseConfigured}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/30 mt-6 group disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  <>Daftar Sekarang <UserPlus className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-10">
            <p className="text-sm text-muted-foreground font-medium">
              Sudah punya akun? <Link href="/auth/login" className="text-primary font-bold hover:underline hover:text-primary/80">Masuk Sekarang</Link>
            </p>
            <Link href="/" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-white transition-colors font-bold uppercase tracking-widest">
              <ChevronLeft className="h-3 w-3" /> Kembali ke Beranda
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
