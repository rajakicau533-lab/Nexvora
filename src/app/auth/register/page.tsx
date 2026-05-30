"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus, Sparkles, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth"
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where, limit } from "firebase/firestore"
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db) {
      setError("Sistem sedang menghubungkan ke server Firebase. Mohon tunggu...")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      // 1. Validasi Username Unik (Firestore Check)
      const cleanUsername = username.toLowerCase().trim().replace(/\s/g, '')
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", cleanUsername), limit(1))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        throw new Error("Username '" + cleanUsername + "' sudah digunakan. Pilih yang lain.")
      }

      // 2. Buat User di Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user

      // 3. Simpan Profil User ke Firestore (users/{uid})
      // NXV + Random 4 digits
      const generatedReferral = "NXV" + Math.floor(1000 + Math.random() * 9000)
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: cleanUsername,
        email: email.toLowerCase().trim(),
        coins: 0,
        status: "active",
        role: "user",
        referralCode: generatedReferral,
        referredBy: referralCode.trim() || null,
        createdAt: serverTimestamp(),
      })

      // 4. Kirim Email Verifikasi
      await sendEmailVerification(user)
      
      // 5. Sign out untuk keamanan (User harus login ulang setelah verifikasi)
      await signOut(auth)

      setIsSuccess(true)
      toast({
        title: "Registrasi Berhasil! 🎉",
        description: "Silakan cek inbox email Anda untuk verifikasi.",
      })
    } catch (err: any) {
      console.error("Registration Error:", err)
      let displayError = "Terjadi kesalahan pendaftaran."
      
      if (err.code === 'auth/email-already-in-use') displayError = "Email ini sudah terdaftar."
      else if (err.code === 'auth/invalid-email') displayError = "Format email tidak valid."
      else if (err.code === 'auth/weak-password') displayError = "Password terlalu lemah (min. 6 karakter)."
      else if (err.message) displayError = err.message

      setError(displayError)
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
            <h2 className="text-3xl font-headline font-bold text-white">Verifikasi Email</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Link aktivasi telah dikirim ke <span className="text-white font-bold">{email}</span>. 
              Mohon verifikasi email Anda sebelum melakukan login ke dashboard.
            </p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl luxury-gradient font-bold text-lg shadow-xl shadow-primary/20">
            <Link href="/auth/login">Kembali ke Login</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
            <h1 className="text-2xl font-headline font-bold text-white uppercase tracking-widest">Pendaftaran Akun</h1>
            <p className="text-muted-foreground font-medium">Bergabunglah dengan ekosistem digital profesional kami.</p>
          </div>
        </div>

        <Card className="premium-card rounded-[2.5rem] border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <CardContent className="pt-10 space-y-6">
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-2xl py-4">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-sm font-black ml-1 uppercase tracking-tight">Username Pilihan</Label>
                <Input 
                  id="username" 
                  placeholder="Contoh: nexvora_user" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-black ml-1 uppercase tracking-tight">Alamat Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@anda.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="Minimal 6 karakter" className="text-white text-sm font-black ml-1 uppercase tracking-tight">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Min. 6 Karakter" 
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral" className="text-white text-sm font-black ml-1 uppercase tracking-tight">Kode Referral (Opsional)</Label>
                <Input 
                  id="referral" 
                  placeholder="Kode dari teman (jika ada)" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-white/10 border-white/20 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-primary/50 text-lg px-6"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-2xl luxury-gradient border-none font-black text-lg shadow-xl shadow-primary/30 mt-6 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  <>Daftar Akun <UserPlus className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-10">
            <p className="text-sm text-muted-foreground font-medium">
              Sudah punya akun? <Link href="/auth/login" className="text-primary font-black hover:underline hover:text-primary/80">Masuk Sekarang</Link>
            </p>
            <Link href="/" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-white transition-colors font-bold uppercase tracking-widest">
              <ChevronLeft className="h-3 w-3" /> Kembali ke Home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}