
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
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Database
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
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

const adminItems = [
  { label: "Admin Console", icon: LayoutDashboard, href: "/admin" },
  { label: "Manage Users", icon: Users, href: "/admin/users" },
  { label: "Traffic Control", icon: TrendingUp, href: "/admin/traffic" },
  { label: "Market Catalog", icon: ShoppingBag, href: "/admin/marketplace" },
  { label: "Financial Log", icon: CreditCard, href: "/admin/financials" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { toast } = useToast()

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
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Administrator</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/50 px-3 uppercase text-[9px] tracking-[0.2em] font-black">Core Management</SidebarGroupLabel>
          <SidebarMenu>
            {adminItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className={cn(
                    "h-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300",
                    pathname === item.href && "bg-primary/15 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-4">
                    <item.icon className="h-4 w-4" />
                    <span className="font-bold tracking-tight">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarSeparator className="my-6 bg-primary/10" />
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary/50 px-3 uppercase text-[9px] tracking-[0.2em] font-black">System Configuration</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild
                className="h-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Link href="/dashboard/admin/settings">
                  <Settings className="h-4 w-4" />
                  <span className="font-bold">Global API Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleAdminLogout}
                className="h-12 rounded-xl hover:text-primary hover:bg-primary/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-bold">Secure Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
          <div className="flex items-center gap-2 text-xs font-black text-primary uppercase mb-2">
            <Database className="h-3 w-3" /> System Health
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
             <div className="bg-primary h-full w-[85%]" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Infrastructure Optimal</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
