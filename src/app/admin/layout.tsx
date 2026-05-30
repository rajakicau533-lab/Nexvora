"use client"

import React, { useEffect, useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { ShieldCheck, Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useUser()
  const router = useRouter()
  const db = useFirestore()
  
  // State to prevent flicker before redirect
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);

  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  useEffect(() => {
    // 1. Wait for everything to finish loading
    if (authLoading || adminLoading) return;

    console.log("ADMIN SECURITY AUDIT:", {
      uid: user?.uid,
      email: user?.email,
      hasAdminDoc: !!adminData,
      role: adminData?.role
    });

    // 2. Check Authentication
    if (!user) {
      console.warn("Audit: No user session. Redirecting to login.");
      setIsAuthorized(false);
      router.push('/admin-login');
      return;
    }

    // 3. Check Authorization (Firestore record)
    if (!adminData || adminData.role !== 'admin') {
      console.error("Audit: User is logged in but NOT found in 'admins' collection with 'admin' role.");
      setIsAuthorized(false);
      router.push('/admin-login');
      return;
    }

    // 4. Access Granted
    console.log("Audit: Access Granted.");
    setIsAuthorized(true);
  }, [user, authLoading, adminData, adminLoading, router]);

  // Loading Screen
  if (authLoading || adminLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse tracking-widest uppercase text-xs">Verifying Admin Otorisasi...</p>
      </div>
    )
  }

  // Final Gate
  if (!isAuthorized) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset className="bg-[#0F0F0F] dark min-h-screen">
        <header className="sticky top-0 z-40 w-full glass-morphism border-none h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-primary/10" />
            <h1 className="font-headline font-bold text-lg hidden md:flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-primary" /> Admin Control Center
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 flex items-center gap-3">
              <div className="text-right leading-none">
                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">Authorized Admin</p>
                <p className="text-sm font-headline font-bold text-white">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
