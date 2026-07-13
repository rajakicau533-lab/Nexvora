
"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  LogOut,
  ShieldCheck,
  BookOpen,
  Activity,
  UserCog,
  FileText,
  Wallet,
  Trophy
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { useAuth, useUser, useDoc, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { doc } from "firebase/firestore"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const adminProfileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'admins', user.uid);
  }, [db, user?.uid]);

  const { data: adminData } = useDoc(adminProfileRef);

  const isMaster = adminData?.role === 'super_admin' || user?.email === "adheprogramer@gmail.com";

  const handleAdminLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      toast({
        title: "Session Terminated",
        description: "Admin panel connection closed.",
      })
      router.push("/admin-login")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Sidebar className="border-r border-primary/10 bg-[#0A0A0A]">
      <SidebarHeader className="py-8 px-6">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-105 transition-transform">
            <ShieldCheck className="text-white h-7 w-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-headline font-bold text-white tracking-tight uppercase">Nexvora</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{adminData?.role === 'super_admin' ? 'MASTER' : 'SUB ADMIN'}</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/50 px-3 uppercase text-[9px] tracking-[0.2em] font-black">Management</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin"} className={cn("h-12 rounded-xl", pathname === "/admin" && "bg-primary/15 text-primary")}>
                <Link href="/admin" className="flex items-center gap-4">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="font-bold">Overview</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin/users"} className={cn("h-12 rounded-xl", pathname === "/admin/users" && "bg-primary/15 text-primary")}>
                <Link href="/admin/users" className="flex items-center gap-4">
                  <Users className="h-4 w-4" />
                  <span className="font-bold">Manage Users</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin/traffic"} className={cn("h-12 rounded-xl", pathname === "/admin/traffic" && "bg-primary/15 text-primary")}>
                <Link href="/admin/traffic" className="flex items-center gap-4">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-bold">Traffic Control</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isMaster && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/topup-monitor"} className={cn("h-12 rounded-xl", pathname === "/admin/topup-monitor" && "bg-primary/15 text-primary")}>
                    <Link href="/admin/topup-monitor" className="flex items-center gap-4">
                      <Wallet className="h-4 w-4" />
                      <span className="font-bold">Topup Monitor</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/referrals"} className={cn("h-12 rounded-xl", pathname === "/admin/referrals" && "bg-primary/15 text-primary")}>
                    <Link href="/admin/referrals" className="flex items-center gap-4">
                      <Trophy className="h-4 w-4" />
                      <span className="font-bold">Referral Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/marketplace"} className={cn("h-12 rounded-xl", pathname === "/admin/marketplace" && "bg-primary/15 text-primary")}>
                    <Link href="/admin/marketplace" className="flex items-center gap-4">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="font-bold">Marketplace Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/admin/materials"} className={cn("h-12 rounded-xl", pathname === "/admin/materials" && "bg-primary/15 text-primary")}>
                    <Link href="/admin/materials" className="flex items-center gap-4">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-bold">Materials Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarGroup>
        
        {isMaster && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary/50 px-3 uppercase text-[9px] tracking-[0.2em] font-black">Administration</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/admins"} className={cn("h-12 rounded-xl", pathname === "/admin/admins" && "bg-primary/15 text-primary")}>
                  <Link href="/admin/admins">
                    <UserCog className="h-4 w-4" />
                    <span className="font-bold">Admin Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/activity"} className={cn("h-12 rounded-xl", pathname === "/admin/activity" && "bg-primary/15 text-primary")}>
                  <Link href="/admin/activity">
                    <Activity className="h-4 w-4" />
                    <span className="font-bold">Audit Activities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/settings"} className={cn("h-12 rounded-xl", pathname === "/admin/settings" && "bg-primary/15 text-primary")}>
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4" />
                    <span className="font-bold">System Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
        
        <SidebarSeparator className="my-6 bg-primary/10" />
        
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleAdminLogout}
                className="h-12 rounded-xl hover:text-primary hover:bg-primary/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-bold">Logout Admin</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase font-black mb-1">Signed in as</p>
          <p className="text-xs font-bold text-white truncate">{user?.email}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
