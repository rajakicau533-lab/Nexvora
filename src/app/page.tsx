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
  { title: "Trafik Service Otomatis", desc: "Meningkatkan engagement Shopee & TikTok secara instan dengan sistem otomatis.", icon: Zap },
  { title: "Creator AI Modern", desc: "Hasilkan konten gambar dan video berkualitas tinggi hanya dengan perintah teks.", icon: Cpu },
  { title: "Marketplace Digital", desc: "Akses produk digital premium eksklusif hanya menggunakan platform koin.", icon: ShoppingCart },
  { title: "Referral Reward", desc: "Dapatkan komisi 10% dari setiap pengisian koin oleh rekan yang Anda ajak.", icon: Users },
  { title: "Dashboard Profesional", desc: "Manajemen seluruh layanan dalam satu tampilan antarmuka yang modern.", icon: Layout },
  { title: "Database Aman", desc: "Sistem enkripsi tingkat tinggi untuk memastikan data Anda selalu terlindungi.", icon: Shield },
]

export default function LandingPage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="bg-[#1A1410] text-white">
        <header className="sticky top-0 z-40 w-full glass-morphism border-none h-16 flex items-center px-4">
          <SidebarTrigger className="text-primary hover:bg-primary/10" />
          <div className="ml-4 font-headline font-bold text-primary tracking-wider uppercase text-xs">
            Nexvora Studio Professional Platform
          </div>
        </header>

        <main className="flex-1">
          <LandingHero />

          {/* Features Grid */}
          <section id="features" className="py-24 bg-black/20">
            <div className="container px-4 mx-auto">
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-headline font-bold">Layanan Unggulan Kami</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Segala kebutuhan pertumbuhan digital Anda tersedia dalam satu ekosistem terpadu.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="premium-card p-8 rounded-3xl group transition-all duration-500">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-headline font-bold mb-3">{benefit.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Testimonials />

          {/* About Section */}
          <section id="about" className="py-24">
            <div className="container px-4 mx-auto">
              <div className="premium-card rounded-[2.5rem] overflow-hidden grid lg:grid-cols-2">
                <div className="p-12 md:p-16 flex flex-col justify-center space-y-8">
                  <h2 className="text-4xl font-headline font-bold leading-tight">Misi Kami Memberdayakan <br /><span className="text-primary">Kreator & Pebisnis</span> Digital</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Nexvora Studio didirikan untuk menjembatani teknologi AI dan strategi pemasaran digital modern bagi audiens Indonesia. Kami percaya bahwa setiap orang berhak memiliki akses ke alat pertumbuhan yang profesional dan terjangkau.
                  </p>
                  <div className="space-y-4">
                    <p className="font-bold flex items-center gap-2">
                      <GraduationCap className="text-primary" /> Materi Belajar Gratis & Update
                    </p>
                    <p className="font-bold flex items-center gap-2">
                      <Shield className="text-primary" /> Keamanan Data Terenkripsi
                    </p>
                  </div>
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-2">WhatsApp Admin Support:</p>
                    <p className="text-2xl font-headline font-bold text-primary">{CONTACT_INFO.whatsapp}</p>
                  </div>
                </div>
                <div className="relative h-[400px] lg:h-full min-h-[500px]">
                  <img 
                    src="https://picsum.photos/seed/nexvora-studio/1000/1000" 
                    alt="Nexvora Team" 
                    className="absolute inset-0 w-full h-full object-cover"
                    data-ai-hint="digital studio workspace"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#1A1410]/80" />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="py-12 border-t border-white/5 text-center">
          <div className="container px-4 mx-auto space-y-6">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight">Nexvora Studio</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Nexvora Studio. All rights reserved. Professional Growth Platform.
            </p>
            <div className="flex justify-center gap-6 text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contact Support</Link>
            </div>
          </div>
        </footer>

        <WhatsAppFloating />
      </SidebarInset>
    </SidebarProvider>
  )
}
