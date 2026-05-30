"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LogIn, Sparkles, AlertCircle, ChevronLeft } from "lucide-react"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    if (!auth) return
    
    setIsLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      if (!userCredential.user.emailVerified) {
        setError("Email belum diverifikasi. Silakan cek inbox/spam Anda.")
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
      setError("Email atau password salah. Silakan coba lagi.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-y-1/2 translate-x-1/2" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Sparkles className="text-white h-7 w-7" />
            </div>
            <span className="text-3xl font-headline font-bold text-white">Nexvora</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold">Selamat Datang Kembali</h1>
            <p className="text-muted-foreground text-sm">Masuk untuk mengelola layanan digital Anda.</p>
          </div>
        </div>

        <Card className="premium-card rounded-3xl border-white/10 bg-black/60 backdrop-blur-xl">
          <CardContent className="pt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-2xl">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">Email</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" title="password" className="text-white font-semibold">Password</Label>
                  <Link href="#" className="text-xs text-primary font-bold hover:underline">Lupa Password?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12 text-white placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Masuk...
                  </div>
                ) : (
                  <>Masuk Sekarang <LogIn className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 pb-8">
            <p className="text-sm text-muted-foreground text-center">
              Belum punya akun? <Link href="/auth/register" className="text-primary font-bold hover:underline">Daftar Gratis</Link>
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