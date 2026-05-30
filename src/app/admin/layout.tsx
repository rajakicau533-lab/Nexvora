"use client"

import React, { useEffect, useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useUser()
  const router = useRouter()
  const db = useFirestore()
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);

  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!user) {
      setIsAuthorized(false);
      router.push('/admin-login');
      return;
    }

    if (adminData && (adminData.role === 'super_admin' || adminData.role === 'admin' || adminData.role === 'assistant_admin')) {
      setIsAuthorized(true);
    } else {
      // Special case for master bootstrap email
      if (user.email === "adheprogramer@gmail.com") {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        router.push('/admin-login');
      }
    }
  }, [user, authLoading, adminData, adminLoading, router]);

  if (authLoading || adminLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse tracking-widest uppercase text-xs">Verifying Access Level...</p>
      </div>
    )
  }

  if (isAuthorized === false) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset className="bg-[#0F0F0F] dark min-h-screen">
        <header className="sticky top-0 z-40 w-full glass-morphism border-none h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-primary/10" />
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <h1 className="font-headline font-bold text-lg hidden md:flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-primary" /> Nexvora Control Center
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 flex items-center gap-3">
              <div className="text-right leading-none hidden sm:block">
                <p className="text-[9px] text-primary uppercase font-black tracking-widest">
                  {adminData?.role?.replace('_', ' ') || 'MASTER'}
                </p>
                <p className="text-xs font-bold text-white">{user?.email}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}