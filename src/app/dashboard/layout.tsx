"use client"

import React, { useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { WhatsAppFloating } from "@/components/ui/WhatsAppFloating"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser()
  const router = useRouter()
  const db = useFirestore()

  const userProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, loading: profileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-[#0F0F0F] dark min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-40 w-full glass-morphism h-16 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-primary/10" />
            <h1 className="font-headline font-bold text-base md:text-lg hidden sm:block text-white">Nexvora Panel</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
              <div className="text-right leading-none hidden xs:block">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">My Balance</p>
                <p className="text-sm font-headline font-bold text-primary">
                  {profile?.coins?.toLocaleString() || 0} 🪙
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="container-custom py-6 md:py-10">
          {children}
        </main>
        
        <WhatsAppFloating />
      </SidebarInset>
    </SidebarProvider>
  )
}