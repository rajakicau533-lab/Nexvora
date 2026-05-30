
"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LogIn, Sparkles, AlertCircle } from "lucide-react"
import { useAuth } from "@/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
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
        setError("Silakan verifikasi email Anda sebelum login. Cek inbox/spam.")
        setIsLoading(false)
        return
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di Nexvora Studio!",
      })
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal login. Periksa email dan password Anda.")
      setIsLoading(false)
    }
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
            <CardTitle className="text-2xl">Masuk Akun</CardTitle>
            <CardDescription>Akses dashboard Nexvora Studio Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-primary hover:underline">Lupa Password?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl luxury-gradient border-none font-bold text-lg shadow-xl shadow-primary/20"
              >
                {isLoading ? "Memproses..." : <><LogIn className="mr-2 h-5 w-5" /> Masuk Sekarang</>}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-white/5 pt-6">
            <p className="text-sm text-muted-foreground">
              Belum punya akun? <Link href="/auth/register" className="text-primary font-bold hover:underline">Daftar Gratis</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
