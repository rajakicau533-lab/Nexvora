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
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);

  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  useEffect(() => {
    // Wait for all loading states to settle
    if (authLoading || adminLoading) return;

    console.log("ADMIN ACCESS AUDIT:", {
      uid: user?.uid,
      email: user?.email,
      adminData: adminData ? "Found" : "Not Found",
      role: adminData?.role || "none"
    });

    if (!user) {
      console.warn("Layout: No user found. Redirecting to login.");
      setIsAuthorized(false);
      router.push('/admin-login');
      return;
    }

    // Special case for master admin to handle any sync delays
    const isMasterAdmin = user.email?.toLowerCase() === "adheprogramer@gmail.com";

    if (adminData && adminData.role === 'admin') {
      console.log("Layout: Authorized successfully.");
      setIsAuthorized(true);
    } else if (isMasterAdmin) {
      // If it's the master admin but data hasn't synced yet, give it one more chance
      console.log("Layout: Master admin detected, waiting for Firestore sync...");
      // We don't redirect master admin immediately to prevent loop
    } else {
      console.error("Layout: Unauthorized. Redirecting.");
      setIsAuthorized(false);
      router.push('/admin-login');
    }
  }, [user, authLoading, adminData, adminLoading, router]);

  if (authLoading || adminLoading || (isAuthorized === null && user?.email?.toLowerCase() !== "adheprogramer@gmail.com")) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline animate-pulse tracking-widest uppercase text-xs">Menyiapkan Enkripsi Admin...</p>
      </div>
    )
  }

  // If master admin and data is still missing, it might be a rules/sync issue
  if (!isAuthorized && user?.email?.toLowerCase() !== "adheprogramer@gmail.com") return null;

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
                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">Status: {adminData ? "Terverifikasi" : "Otentikasi..."}</p>
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
