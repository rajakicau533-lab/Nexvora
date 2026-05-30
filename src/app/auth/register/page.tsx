"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UserPlus, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db) return
    
    setIsLoading(true)
    setError(null)

    try {
      // 1. Check if username is unique
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("username", "==", username))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        throw new Error("Username sudah digunakan. Silakan pilih username lain.")
      }

      // 2. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 3. Send Verification Email
      await sendEmailVerification(user)

      // 4. Save User Profile in Firestore
      const generatedReferral = username.toUpperCase().substring(0, 3) + Math.floor(100 + Math.random() * 900)
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        email,
        coins: 0,
        status: "active",
        role: "user",
        referralCode: generatedReferral,
        referredBy: referralCode || null,
        createdAt: serverTimestamp(),
      })

      setIsSuccess(true)
      toast({
        title: "Registrasi Berhasil",
        description: "Silakan cek email Anda untuk verifikasi.",
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal mendaftar. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#1A1410] flex items-center justify-center p-4">
        <Card className="premium-card max-w-md w-full rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-headline font-bold">Cek Email Anda!</h2>
          <p className="text-muted-foreground leading-relaxed">
            Kami telah mengirimkan link verifikasi ke <b>{email}</b>. 
            Silakan verifikasi email Anda sebelum melakukan login.
          </p>
          <Button asChild className="w-full h-12 rounded-xl luxury-gradient">
            <Link href="/auth/login">Kembali ke Login</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A1410] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-primary-foreground h-7 w-7" />
            </div>
            <span className="text-3xl font-headline font-bold text-white">Nexvora</span>
          </Link>
        </div>

        <Card className="premium-card rounded-3xl border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl">Daftar Akun</CardTitle>
            <CardDescription>Bergabung dengan komunitas Nexvora Studio.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Contoh: nexvora_user" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nama@email.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Min. 8 Karakter" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral">Kode Referral (Opsional)</Label>
                <Input 
                  id="referral" 
                  placeholder="Masukkan kode teman" 
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20 mt-4"
              >
                {isLoading ? "Memproses..." : <><UserPlus className="mr-2 h-5 w-5" /> Buat Akun Sekarang</>}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-white/5 pt-6">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun? <Link href="/auth/login" className="text-primary font-bold hover:underline">Masuk Di Sini</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
