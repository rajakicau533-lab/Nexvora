"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  UserPlus, 
  LogIn, 
  Sparkles, 
  MessageSquare, 
  Info,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  BookOpen,
  Users,
  Trophy,
  Rocket,
  Star,
  Facebook,
  Instagram,
  Search,
  Zap,
  MousePointerClick,
  FileText,
  Video
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
  SidebarSeparator,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from "@/components/ui/sidebar"
import { useAuth, useUser, useFirestore, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { doc } from "firebase/firestore"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Fitur", icon: Sparkles, href: "/#features" },
  { label: "Testimoni", icon: MessageSquare, href: "/#testimonials" },
  { label: "Tentang Kami", icon: Info, href: "/#about" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { toast } = useToast()
  const { setOpenMobile, isMobile } = useSidebar()
  const db = useFirestore()
  
  const isDashboard = pathname.startsWith('/dashboard')

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [pathname, isMobile, setOpenMobile])

  const profileRef = React.useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

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

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="py-6 px-6">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-2 group">
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
                    <Link href={item.href} onClick={handleLinkClick} className="flex items-center gap-3">
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
                      <Link href="/auth/register" onClick={handleLinkClick} className="flex items-center gap-3">
                        <UserPlus className="h-4 w-4" />
                        <span className="font-medium">Daftar</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="hover:bg-primary/10 transition-all">
                      <Link href="/auth/login" onClick={handleLinkClick} className="flex items-center gap-3">
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
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="font-medium">Dashboard Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard/inject-ads"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard/inject-ads" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard/inject-ads" onClick={handleLinkClick} className="flex items-center gap-3">
                      <Rocket className="h-4 w-4" />
                      <span className="font-medium">Inject Ads</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard/compensation"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard/compensation" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard/compensation" onClick={handleLinkClick} className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Kompensasi Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <Collapsible defaultOpen={pathname.startsWith('/dashboard/traffic')} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-all duration-200">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">Trafik</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="pr-0">
                        {/* Shopee Section */}
                        <Collapsible defaultOpen={pathname.includes('/shopee')} className="group/shopee-collapsible">
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton className="hover:text-primary transition-colors cursor-pointer pr-4">
                                <span className="font-bold">Shopee</span>
                                <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/shopee-collapsible:rotate-180" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-2 border-l-0 border-white/5 bg-white/[0.03] rounded-lg mt-1 overflow-hidden">
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/followers"}>
                                    <Link href="/dashboard/traffic/followers" onClick={handleLinkClick}>Shopee Followers</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/likes"}>
                                    <Link href="/dashboard/traffic/likes" onClick={handleLinkClick}>Shopee Like</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/shopee"}>
                                    <Link href="/dashboard/traffic/shopee" onClick={handleLinkClick}>Trafik Shopee</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/shopee-comment"}>
                                    <Link href="/dashboard/traffic/shopee-comment" onClick={handleLinkClick}>Shopee Comment</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/shopee-live"}>
                                    <Link href="/dashboard/traffic/shopee-live" onClick={handleLinkClick}>Trafik Live</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>

                        {/* TikTok Section */}
                        <Collapsible defaultOpen={pathname.includes('/tiktok')} className="group/tiktok-collapsible mt-1">
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton className="hover:text-primary transition-colors cursor-pointer pr-4">
                                <span className="font-bold">TikTok</span>
                                <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/tiktok-collapsible:rotate-180" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-2 border-l-0 border-white/5 bg-white/[0.03] rounded-lg mt-1 overflow-hidden">
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/tiktok-view"}>
                                    <Link href="/dashboard/traffic/tiktok-view" onClick={handleLinkClick}>TikTok VT View</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/tiktok-saved"}>
                                    <Link href="/dashboard/traffic/tiktok-saved" onClick={handleLinkClick}>TikTok Saved</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/tiktok-comment"}>
                                    <Link href="/dashboard/traffic/tiktok-comment" onClick={handleLinkClick}>TikTok Comment</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>

                        {/* Facebook Section */}
                        <Collapsible defaultOpen={pathname.includes('/fb-')} className="group/fb-collapsible mt-1">
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton className="hover:text-primary transition-colors cursor-pointer pr-4">
                                <span className="font-bold">Facebook</span>
                                <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/fb-collapsible:rotate-180" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-2 border-l-0 border-white/5 bg-white/[0.03] rounded-lg mt-1 overflow-hidden">
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/fb-traffic"}>
                                    <Link href="/dashboard/traffic/fb-traffic" onClick={handleLinkClick}>Trafik FB</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/fb-comment"}>
                                    <Link href="/dashboard/traffic/fb-comment" onClick={handleLinkClick}>Komentar FB</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>

                        {/* Instagram Section */}
                        <Collapsible defaultOpen={pathname.includes('/ig-')} className="group/ig-collapsible mt-1">
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton className="hover:text-primary transition-colors cursor-pointer pr-4">
                                <span className="font-bold">Instagram</span>
                                <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/ig-collapsible:rotate-180" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-2 border-l-0 border-white/5 bg-white/[0.03] rounded-lg mt-1 overflow-hidden">
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/ig-traffic"}>
                                    <Link href="/dashboard/traffic/ig-traffic" onClick={handleLinkClick}>Trafik IG</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/traffic/ig-comment"}>
                                    <Link href="/dashboard/traffic/ig-comment" onClick={handleLinkClick}>Komentar IG</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <Collapsible defaultOpen={pathname.startsWith('/dashboard/info-admin')} className="group/collapsible-info">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="hover:bg-primary/10 hover:text-primary transition-all duration-200">
                        <Info className="h-4 w-4" />
                        <span className="font-medium">Info Admin</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-info:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="pr-0">
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/info-admin/forum"}>
                            <Link href="/dashboard/info-admin/forum" onClick={handleLinkClick}>Forum Komunitas</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton asChild isActive={pathname === "/dashboard/info-admin/kelas"}>
                            <Link href="/dashboard/info-admin/kelas" onClick={handleLinkClick}>Info Kelas</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard/marketplace"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard/marketplace" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard/marketplace" onClick={handleLinkClick} className="flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="font-medium">Marketplace</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard/referral"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard/referral" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard/referral" onClick={handleLinkClick} className="flex items-center gap-3">
                      <Trophy className="h-4 w-4" />
                      <span className="font-medium">Referral Reward</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard/materials"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard/materials" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard/materials" onClick={handleLinkClick} className="flex items-center gap-3">
                      <GraduationCap className="h-4 w-4" />
                      <span className="font-medium">Tutorial</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/dashboard/topup"}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-all duration-200",
                      pathname === "/dashboard/topup" && "bg-primary/15 text-primary"
                    )}
                  >
                    <Link href="/dashboard/topup" onClick={handleLinkClick} className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Top Up Koin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarSeparator className="my-4 opacity-50" />
            
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground/50 px-3 uppercase text-[10px] tracking-widest font-bold">System</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => {
                      handleLogout()
                      handleLinkClick()
                    }}
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
