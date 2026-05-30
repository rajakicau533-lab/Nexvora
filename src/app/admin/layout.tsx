"use client"

import React, { useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { useUser, useDoc, useFirestore, useAuth } from "@/firebase"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { ShieldCheck } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser()
  const auth = useAuth()
  const router = useRouter()
  const db = useFirestore()

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);

  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  useEffect(() => {
    // Debug Logging
    console.log("Admin Security Audit:", {
      authLoading: loading,
      adminLoading,
      currentUser: auth?.currentUser?.email,
      uid: user?.uid,
      hasAdminData: !!adminData,
      adminRole: adminData?.role
    });

    if (loading || adminLoading) return;

    if (!user) {
      console.warn("Access Denied: No active session. Redirecting to login.");
      router.push('/admin-login');
      return;
    }

    if (!adminData || adminData.role !== 'admin') {
      console.warn("Access Denied: UID not found in admins collection or invalid role.", user.uid);
      router.push('/admin-login');
      return;
    }

    console.log("Admin Authenticated Successfully.");
  }, [user, loading, adminData, adminLoading, router, auth]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse">Verifying Admin Access...</p>
      </div>
    )
  }

  // Final gate to prevent flash of content
  if (!user || !adminData || adminData.role !== 'admin') return null;

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
