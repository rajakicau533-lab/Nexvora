"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LogIn, Sparkles, AlertCircle, ChevronLeft } from "lucide-react"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) {
      setError("Gagal menghubungkan ke server Firebase.")
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      
      // Check verification
      if (!userCredential.user.emailVerified) {
        setError("Email Anda belum diverifikasi. Cek inbox atau folder spam Anda.")
        await signOut(auth)
        setIsLoading(false)
        return
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali di Nexvora Studio!",
      })
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError("Email atau password tidak sesuai. Mohon periksa kembali.")
      setIsLoading(false)
    }
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
    </div>
  )
}
