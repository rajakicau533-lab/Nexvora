
"use client"

import React, { useMemo, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { ShieldCheck, Loader2, User, AlertCircle, Wallet } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const pathname = usePathname()
  
  const adminProfileRef = useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);

  const { data: adminData, loading: adminLoading } = useDoc(adminProfileRef);

  // Auth Guard Logic
  useEffect(() => {
    if (!authLoading && !user && pathname !== "/admin-login") {
      router.push("/admin-login");
    }
  }, [user, authLoading, pathname, router]);

  // Role Guard Logic for Sub Admins
  useEffect(() => {
    if (!adminLoading && adminData && user) {
      const role = adminData.role?.toUpperCase() || "";
      const isMaster = role === 'SUPER_ADMIN' || role === 'MASTER_ADMIN' || user.email === 'adheprogramer@gmail.com';
      
      // Paths that only Master Admin can access
      const masterOnlyPaths = ["/admin/admins", "/admin/settings", "/admin/revenue", "/admin/topup-monitor", "/admin/marketplace", "/admin/materials"];
      const isTryingToAccessMasterPath = masterOnlyPaths.some(path => pathname.startsWith(path));

      if (!isMaster && isTryingToAccessMasterPath) {
        router.push("/admin");
      }
    }
  }, [adminData, adminLoading, user, pathname, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-headline tracking-widest uppercase text-[10px]">Memverifikasi Otoritas...</p>
      </div>
    )
  }

  // If not logged in, we let the useEffect handle the redirect
  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebar />
      <SidebarInset className="bg-[#0F0F0F] dark min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-40 w-full glass-morphism h-16 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-primary hover:bg-primary/10" />
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <h1 className="font-headline font-bold text-base md:text-lg hidden md:flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-primary" /> Nexvora Admin Panel
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sub Admin Balance Monitor */}
            {adminData?.role === 'assistant_admin' && (
              <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 flex items-center gap-2 mr-2">
                 <Wallet className="h-3.5 w-3.5 text-primary" />
                 <span className="text-xs font-bold text-white">{adminData.coins || 0} 🪙</span>
              </div>
            )}
            
            <div className="bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 flex items-center gap-3">
              <div className="text-right leading-none hidden sm:block">
                <p className="text-[9px] text-primary uppercase font-black tracking-widest">
                  {adminLoading ? 'LOADING...' : (adminData?.role || 'ADMIN')}
                </p>
                <p className="text-xs font-bold text-white max-w-[150px] truncate">{user?.email || 'ADMIN'}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        <main className="container-custom py-6 md:py-10">
          {adminLoading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Memuat Profil Admin...</p>
             </div>
          ) : !adminData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-bold text-white">Akses Ditolak</h2>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">Akun Anda tidak terdaftar sebagai administrator di sistem kami.</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
