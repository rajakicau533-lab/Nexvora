import React from "react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { LandingHero } from "@/components/sections/LandingHero"
import { Testimonials } from "@/components/sections/Testimonials"
import { Zap, Shield, Cpu, ShoppingCart, Users, GraduationCap, Layout } from "lucide-react"
import { WhatsAppFloating } from "@/components/ui/WhatsAppFloating"
import { CONTACT_INFO } from "@/lib/constants"

const benefits = [
  { title: "Trafik Otomatis", desc: "Tingkatkan engagement Shopee & TikTok secara instan dengan sistem cerdas.", icon: Zap },
  { title: "Creator AI", desc: "Hasilkan gambar dan video visual 4K premium hanya dengan perintah teks.", icon: Cpu },
  { title: "Marketplace Digital", desc: "Akses produk digital eksklusif yang dikurasi khusus untuk member.", icon: ShoppingCart },
  { title: "Referral Reward", desc: "Dapatkan pasif koin 10% dari setiap pengisian koin rekan Anda.", icon: Users },
  { title: "Panel Profesional", desc: "Manajemen seluruh layanan dalam satu dashboard modern dan cepat.", icon: Layout },
  { title: "Enkripsi Aman", desc: "Sistem keamanan tingkat tinggi untuk perlindungan privasi data Anda.", icon: Shield },
]

export default function LandingPage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-[#0F0F0F] text-white overflow-x-hidden">
        <header className="sticky top-0 z-40 w-full glass-morphism h-16 flex items-center px-4 md:px-8">
          <SidebarTrigger className="text-primary hover:bg-primary/10" />
          <div className="ml-4 font-headline font-bold text-primary tracking-wider uppercase text-[10px] hidden sm:block">
            Nexvora Studio Platform
          </div>
        </header>

        <main className="flex-1">
          <LandingHero />

          <section id="features" className="py-20 md:py-32 bg-white/[0.02]">
            <div className="container-custom">
              <div className="text-center mb-16 space-y-3">
                <h2 className="text-3xl md:text-4xl font-headline font-bold">Layanan Ekosistem Digital</h2>
                <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
                  Segala kebutuhan pertumbuhan bisnis digital Anda tersedia dalam satu platform terpadu.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="premium-card p-8 rounded-3xl group transition-all duration-500 bg-black/40">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-headline font-bold mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Testimonials />

          <section id="about" className="py-20 md:py-32">
            <div className="container-custom">
              <div className="premium-card rounded-[2.5rem] overflow-hidden grid lg:grid-cols-2 bg-black/40">
                <div className="p-8 md:p-16 flex flex-col justify-center space-y-6">
                  <h2 className="text-3xl md:text-4xl font-headline font-bold leading-tight">Misi Memberdayakan <br /><span className="text-primary">Kreator & Pebisnis</span></h2>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Nexvora Studio didirikan untuk menjembatani teknologi AI dan strategi pemasaran modern bagi masyarakat Indonesia. Kami percaya akses ke alat pertumbuhan digital haruslah mudah dan terjangkau bagi siapa saja.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                      <GraduationCap className="text-primary h-5 w-5" /> Materi Belajar Eksklusif Member
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                      <Shield className="text-primary h-5 w-5" /> Data Akun Terenkripsi 256-bit
                    </div>
                  </div>
                </div>
                <div className="relative h-[300px] lg:h-auto min-h-[400px]">
                  <img 
                    src="https://picsum.photos/seed/nexvora-studio/1000/1000" 
                    alt="Nexvora Workspace" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent to-[#0F0F0F]" />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-12 border-t border-white/5 text-center bg-black/40">
          <div className="container-custom space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-headline font-bold text-lg tracking-tight uppercase">Nexvora Studio</span>
            </div>
            <p className="text-muted-foreground text-[13px]">
              © {new Date().getFullYear()} Nexvora Studio. Hak Cipta Dilindungi.
            </p>
          </div>
        </footer>

        <WhatsAppFloating />
      </SidebarInset>
    </SidebarProvider>
  )
}