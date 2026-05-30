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

    console.log("--- ADMIN LOGIN DEBUG START ---");
    console.log("Input Email:", email);

    try {
      let user;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
        user = userCredential.user
        console.log("Firebase Auth Success. UID:", user.uid);
      } catch (authError: any) {
        if ((authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') && email === TARGET_ADMIN_EMAIL) {
          console.log("Target admin not found. Attempting auto-registration...");
          const newCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
          user = newCredential.user;
          console.log("Auto-registration success. UID:", user.uid);
        } else {
          console.error("Auth Error Code:", authError.code);
          throw new Error("Email atau password administrator salah.");
        }
      }

      console.log("Checking Firestore for UID:", user.uid);
      const adminRef = doc(db, "admins", user.uid);
      let adminDoc;
      
      try {
        adminDoc = await getDoc(adminRef);
        console.log("Admin Doc Snapshot - Exists:", adminDoc.exists());
      } catch (firestoreError: any) {
        console.error("Firestore Permission Error:", firestoreError.message);
        throw new Error("Gagal memverifikasi izin Firestore.");
      }

      if (!adminDoc.exists()) {
        if (email === TARGET_ADMIN_EMAIL) {
          console.log("Creating missing admin record for target user...");
          await setDoc(adminRef, {
            email: email.toLowerCase().trim(),
            role: "admin",
            status: "active",
            createdAt: serverTimestamp()
          });
          console.log("Admin record created successfully.");
        } else {
          console.warn("Access Denied: UID not found in admins collection.");
          await signOut(auth)
          throw new Error("Akses administrator ditolak.");
        }
      } else {
        const adminData = adminDoc.data();
        if (adminData?.role !== "admin") {
          console.warn("Access Denied: Invalid role:", adminData?.role);
          await signOut(auth)
          throw new Error("Akses ditolak. Role Anda bukan admin.");
        }
      }

      console.log("--- ADMIN LOGIN DEBUG SUCCESS ---");
      toast({
        title: "Admin Authenticated",
        description: "Redirecting to Control Center...",
      })
      
      router.push("/admin")
    } catch (err: any) {
      console.error("--- ADMIN LOGIN DEBUG ERROR ---");
      console.error("Error Message:", err.message);
      setError(err.message || "Terjadi kesalahan saat otentikasi admin.");
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
