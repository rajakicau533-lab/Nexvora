
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

  // Fetch real-time user profile for coins and status
  const userProfileQuery = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userProfileQuery);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1410] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-[#1A1410] dark min-h-screen">
        <header className="sticky top-0 z-40 w-full glass-morphism border-none h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-primary/10" />
            <h1 className="font-headline font-bold text-lg hidden md:block">Nexvora Panel</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
              <div className="text-right leading-none">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">My Balance</p>
                <p className="text-sm font-headline font-bold text-primary">
                  {profile?.coins?.toLocaleString() || 0} 🪙
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
        
        <WhatsAppFloating />
      </SidebarInset>
    </SidebarProvider>
  )
}
