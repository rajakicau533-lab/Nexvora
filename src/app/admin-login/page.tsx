"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShieldAlert, LogIn, ChevronLeft } from "lucide-react"
import { useAuth, useFirestore } from "@/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

const TARGET_ADMIN_EMAIL = "adheprogramer@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !db) {
      setError("Gagal menghubungkan ke server Firebase.")
      return
    }
    
    setIsLoading(true)
    setError(null)

    const normalizedInputEmail = email.toLowerCase().trim();

    console.log("--- ADMIN LOGIN ATTEMPT ---");
    console.log("Input Email:", normalizedInputEmail);

    try {
      let user;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedInputEmail, password)
        user = userCredential.user
        console.log("Auth Success. UID:", user.uid);
      } catch (authError: any) {
        // Auto-register master admin if not exists
        if ((authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-login-credentials') && normalizedInputEmail === TARGET_ADMIN_EMAIL) {
          console.log("Target admin not found or invalid. Attempting bootstrap registration...");
          try {
            const newCredential = await createUserWithEmailAndPassword(auth, normalizedInputEmail, password);
            user = newCredential.user;
          } catch (regError: any) {
             throw new Error("Gagal mendaftarkan admin master. " + regError.message);
          }
        } else {
          throw new Error("Kredensial administrator tidak valid.");
        }
      }

      if (!user) throw new Error("User session not found.");

      const adminRef = doc(db, "admins", user.uid);
      const adminDoc = await getDoc(adminRef);

      // Force create/update admin record for the target master email
      if (normalizedInputEmail === TARGET_ADMIN_EMAIL) {
        console.log("Ensuring admin record exists for master account...");
        await setDoc(adminRef, {
          email: normalizedInputEmail,
          role: "super_admin",
          status: "active",
          updatedAt: serverTimestamp(),
          createdAt: adminDoc.exists() ? adminDoc.data()?.createdAt : serverTimestamp()
        }, { merge: true });
      } else if (!adminDoc.exists()) {
        console.warn("Unauthorized access attempt. Document not found in 'admins' collection.");
        await signOut(auth);
        throw new Error("Akses ditolak. Anda tidak memiliki izin administrator.");
      }

      console.log("Redirecting to admin panel...");
      toast({
        title: "Admin Authenticated",
        description: "Selamat datang di Control Center.",
      })
      
      router.push("/admin")
    } catch (err: any) {
      console.error("Login process error:", err.message);
      setError(err.message || "Terjadi kesalahan sistem saat login.");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
              <ShieldAlert className="text-white h-10 w-10" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-white uppercase tracking-widest">Admin Central</h1>
            <p className="text-muted-foreground font-medium">Otorisasi Administrator Nexvora Studio</p>
          </div>
        </div>

        <Card className="premium-card rounded-[2.5rem] border-primary/20 bg-black/80 backdrop-blur-2xl overflow-hidden shadow-2xl">
          <CardContent className="pt-10 space-y-6">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-white rounded-2xl">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <AlertDescription className="font-bold">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-xs font-black ml-1 uppercase tracking-widest">Email Admin</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required
                  placeholder="admin@nexvora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-white text-xs font-black ml-1 uppercase tracking-widest">Kunci Keamanan</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  placeholder="Password Admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 text-white focus:border-primary/50"
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
                    Otorisasi...
                  </div>
                ) : (
                  <>Buka Akses Panel <LogIn className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-10">
            <Link href="/" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-white transition-colors font-bold uppercase tracking-widest">
              <ChevronLeft className="h-3 w-3" /> Kembali ke Situs Utama
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}