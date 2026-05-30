"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus, Sparkles, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth"
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db) {
      setError("Sistem sedang disiapkan. Silakan refresh.")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      // 1. Validasi Username Unik
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", username.toLowerCase()))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        throw new Error("Username sudah digunakan oleh pengguna lain.")
      }

      // 2. Buat User di Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 3. Simpan Profil User di Firestore
      const generatedReferral = "NXV" + Math.floor(1000 + Math.random() * 9000)
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        coins: 0,
        status: "active",
        role: "user",
        referralCode: generatedReferral,
        referredBy: referralCode || null,
        createdAt: serverTimestamp(),
      })

      // 4. Kirim Verifikasi Email
      await sendEmailVerification(user)
      
      // 5. Logout agar tidak bypass verifikasi
      await signOut(auth)

      setIsSuccess(true)
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Silakan verifikasi email Anda untuk melanjutkan.",
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal mendaftar. Periksa kembali data Anda.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
        <Card className="premium-card max-w-md w-full rounded-3xl p-8 text-center space-y-6 border-primary/20">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-white">Verifikasi Email</h2>
            <p className="text-muted-foreground leading-relaxed">
              Link verifikasi telah dikirim ke <span className="text-white font-bold">{email}</span>. 
              Silakan periksa folder inbox atau spam Anda.
            </p>
          </div>
          <Button asChild className="w-full h-12 rounded-xl luxury-gradient font-bold">
            <Link href="/auth/login">Kembali ke Login</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Sparkles className="text-white h-7 w-7" />
            </div>
            <span className="text-3xl font-headline font-bold text-white">Nexvora</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold">Buat Akun Baru</h1>
            <p className="text-muted-foreground text-sm">Bergabunglah dengan ekosistem digital premium kami.</p>
          </div>
        </div>

        <Card className="premium-card rounded-3xl border-white/10 bg-black/60 backdrop-blur-xl">
          <CardContent className="pt-8">
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-2xl">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white font-semibold">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Contoh: nexvora_user" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">Alamat Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="At least 8 characters" className="text-white font-semibold">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Minimal 8 Karakter" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral" className="text-white font-semibold">Kode Referral (Opsional)</Label>
                <Input 
                  id="referral" 
                  placeholder="Punya kode dari teman?" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20 mt-4 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </div>
                ) : (
                  <>Daftar Sekarang <UserPlus className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 pb-8">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun? <Link href="/auth/login" className="text-primary font-bold hover:underline">Masuk di sini</Link>
            </p>
            <Link href="/" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-white transition-colors">
              <ChevronLeft className="h-3 w-3" /> Kembali ke Beranda
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}