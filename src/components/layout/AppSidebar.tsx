
"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  UserPlus, 
  LogIn, 
  Sparkles, 
  Zap, 
  MessageSquare, 
  Info,
  TrendingUp,
  Cpu,
  ShoppingBag,
  Users,
  CreditCard,
  BookOpen,
  LogOut,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { APP_NAME, CONTACT_INFO } from "@/lib/constants"
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
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Fitur", icon: Sparkles, href: "/#features" },
  { label: "Testimoni", icon: MessageSquare, href: "/#testimonials" },
  { label: "Tentang Kami", icon: Info, href: "/#about" },
]

const serviceItems = [
  { label: "Trafik Service", icon: TrendingUp, href: "/dashboard/traffic" },
  { label: "Creator AI", icon: Cpu, href: "/dashboard/ai" },
  { label: "Marketplace", icon: ShoppingBag, href: "/dashboard/marketplace" },
  { label: "Top Up Koin", icon: CreditCard, href: "/dashboard/topup" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { toast } = useToast()
  
  const isDashboard = pathname.startsWith('/dashboard')

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      toast({
        title: "Signed Out",
        description: "Sampai jumpa kembali!",
      })
      router.push("/")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="py-6 px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Sparkles className="text-primary-foreground h-6 w-6" />
          </div>
          <span className="text-xl font-headline font-bold text-foreground tracking-tight">
            {APP_NAME}
          </span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        {!isDashboard ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/50 px-3 uppercase text-[10px] tracking-widest font-bold">Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === item.href && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {!user && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="hover:bg-primary/10 transition-all">
                      <Link href="/auth/register" className="flex items-center gap-3">
                        <UserPlus className="h-4 w-4" />
                        <span className="font-medium">Daftar</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="hover:bg-primary/10 transition-all">
                      <Link href="/auth/login" className="flex items-center gap-3">
                        <LogIn className="h-4 w-4" />
                        <span className="font-medium">Login</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground/50 px-3 uppercase text-[10px] tracking-widest font-bold">Services</SidebarGroupLabel>
              <SidebarMenu>
                {serviceItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.href}
                      className={cn(
                        "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                        pathname === item.href && "bg-primary/15 text-primary"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarSeparator className="my-4 opacity-50" />
            
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground/50 px-3 uppercase text-[10px] tracking-widest font-bold">System</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleLogout}
                    className="hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent p-4 border border-primary/10">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Butuh Bantuan?</p>
          <a 
            href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group text-sm font-semibold text-primary hover:text-secondary transition-colors"
          >
            <span>Live Chat Admin</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
