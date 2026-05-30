import React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { WhatsAppFloating } from "@/components/ui/WhatsAppFloating"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-[#1A1410] dark min-h-screen">
        <header className="sticky top-0 z-40 w-full glass-morphism border-none h-16 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-primary/10" />
            <h1 className="font-headline font-bold text-lg hidden md:block">Dashboard Panel</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-3">
              <div className="text-right leading-none">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">My Koin</p>
                <p className="text-sm font-headline font-bold text-primary">1,250 🪙</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                U
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
