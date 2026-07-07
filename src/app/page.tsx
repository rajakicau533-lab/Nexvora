import React from "react"
import Link from "next/link"
import { 
  Zap, 
  Users, 
  GraduationCap, 
  ShoppingCart, 
  TrendingUp, 
  MessageSquare, 
  ArrowRight,
  Trophy,
  Wallet,
  Star,
  Plus,
  Shield,
  Activity,
  CheckCircle2,
  Lock,
  Globe
} from "lucide-react"
import { LandingHero } from "@/components/sections/LandingHero"
import { Testimonials } from "@/components/sections/Testimonials"
import { ShowcaseSlider } from "@/components/sections/ShowcaseSlider"
import { WhatsAppFloating } from "@/components/ui/WhatsAppFloating"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CONTACT_INFO } from "@/lib/constants"

const stats = [
  { label: "Member Aktif", value: "145+" },
  { label: "Order Diproses", value: "2.500+" },
  { label: "Kepuasan Member", value: "98%" },
  { label: "Admin Aktif", value: "20+" },
]

const mainFeatures = [
  { title: "Trafik Shopee", desc: "Optimasi kunjungan produk Shopee secara instan.", icon: TrendingUp },
  { title: "Shopee Followers", desc: "Tingkatkan jumlah pengikut toko dengan aman.", icon: Users },
  { title: "Shopee Like", desc: "Tambah favorit pada produk untuk meningkatkan kepercayaan.", icon: Star },
  { title: "Shopee Comment", desc: "Berikan komentar kustom pada video atau produk.", icon: MessageSquare },
  { title: "TikTok VT View", desc: "Tingkatkan tayangan video TikTok secara otomatis.", icon: Zap },
  { title: "TikTok Saved", desc: "Tambah jumlah simpanan video untuk viralitas.", icon: Plus },
  { title: "TikTok Comment", desc: "Interaksi komentar real untuk video TikTok Anda.", icon: MessageSquare },
  { title: "Premium Member", desc: "Akses riset produk dan fitur eksklusif lainnya.", icon: Trophy },
  { title: "Marketplace", desc: "Koleksi aset digital siap pakai untuk bisnis.", icon: ShoppingCart },
  { title: "Referral Reward", desc: "Dapatkan komisi dengan mengundang teman bergabung.", icon: Trophy },
  { title: "Free Materi", desc: "Edukasi strategi Shopee & TikTok gratis.", icon: GraduationCap },
  { title: "Top Up Koin", desc: "Sistem pengisian saldo koin yang mudah dan cepat.", icon: Wallet },
]

const benefits = [
  { title: "Proses Cepat", icon: Zap, desc: "Sistem otomatisasi server tingkat tinggi." },
  { title: "Aman Digunakan", icon: Shield, desc: "Sesuai dengan algoritma platform terbaru." },
  { title: "Monitoring Real Time", icon: Activity, desc: "Pantau status pesanan kapan saja." },
  { title: "Komunitas Aktif", icon: Users, desc: "Diskusi & berbagi strategi growth." }
]

const advantages = [
  "Dashboard Modern", "Sistem Koin Fleksibel", "Mobile Friendly", "Aman & Terpercaya"
]

const steps = [
  { step: "Langkah 1", title: "Daftar Akun", desc: "Buat akun Nexvora Studio Anda dalam hitungan detik." },
  { step: "Langkah 2", title: "Top Up Koin", desc: "Isi saldo koin untuk mulai menggunakan layanan digital." },
  { step: "Langkah 3", title: "Gunakan Fitur", desc: "Pilih layanan trafik atau tools yang Anda butuhkan." },
  { step: "Langkah 4", title: "Pantau Hasil", desc: "Lihat perkembangan performa akun Anda secara realtime." },
]

const faqs = [
  { q: "Apakah Nexvora Studio aman?", a: "Sangat aman. Kami menggunakan sistem enkripsi tingkat tinggi dan metode distribusi trafik yang sesuai dengan algoritma platform." },
  { q: "Bagaimana cara top up?", a: "Anda dapat melakukan top up melalui transfer bank di menu Top Up Koin, lalu kirim bukti transfer ke Admin WhatsApp untuk aktivasi cepat." },
  { q: "Berapa harga koin?", a: "Harga koin bersifat fleksibel dan sangat terjangkau, mulai dari Rp3.000 per koin dengan paket hemat untuk member premium." },
  { q: "Apakah ada komunitas?", a: "Ya, kami memiliki grup komunitas eksklusif di WhatsApp untuk saling berbagi strategi affiliate dan pertumbuhan akun." },
  { q: "Bagaimana menghubungi admin?", a: "Tim support kami aktif 24/7. Klik tombol WhatsApp di pojok layar atau menu Hubungi Kami untuk bantuan instan." },
]

export default function LandingPage() {
  return (
    <div className="bg-[#0F0F0F] text-white min-h-screen overflow-x-hidden font-body selection:bg-primary/30">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full glass-morphism h-20 flex items-center px-6 md:px-12 justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
            <Zap className="text-white h-6 w-6" />
          </div>
          <span className="text-xl font-headline font-bold text-white tracking-tight uppercase">Nexvora Studio</span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8">
           <Link href="/" className="text-sm font-bold text-white/70 hover:text-primary transition-colors">Home</Link>
           <Link href="/dashboard/marketplace" className="text-sm font-bold text-white/70 hover:text-primary transition-colors">Marketplace</Link>
           <Link href="/dashboard/topup" className="text-sm font-bold text-white/70 hover:text-primary transition-colors">Top Up Koin</Link>
           <a href={CONTACT_INFO.whatsapp_group} target="_blank" className="text-sm font-bold text-white/70 hover:text-primary transition-colors">Komunitas</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="hidden sm:flex text-white/70 hover:text-white font-bold">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild className="luxury-gradient rounded-xl font-bold h-11 px-6 border-none">
            <Link href="/auth/register">Mulai Sekarang</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <LandingHero />

        {/* Statistik Live */}
        <section className="py-12 border-y border-white/5 bg-black/40">
          <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center space-y-1 group">
                <p className="text-3xl md:text-4xl font-headline font-bold text-primary group-hover:scale-110 transition-transform duration-500">{stat.value}</p>
                <p className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefit Highlights */}
        <section className="py-20 bg-gradient-to-b from-black/20 to-transparent">
           <div className="container-custom">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {benefits.map((benefit, i) => (
                   <div key={i} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center space-y-3 group hover:border-primary/40 transition-all duration-500">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                         <benefit.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{benefit.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">{benefit.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Fitur Utama */}
        <section id="features" className="py-24 md:py-40">
          <div className="container-custom">
            <div className="text-center mb-20 space-y-4">
              <Badge className="bg-primary/10 text-primary border border-primary/20 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Powerful Tools</Badge>
              <h2 className="text-4xl md:text-5xl font-headline font-bold">Layanan Ekosistem Digital</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Platform terlengkap untuk mendukung akselerasi pertumbuhan bisnis online Anda.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mainFeatures.map((feat, idx) => (
                <div key={idx} className="premium-card p-8 rounded-[2rem] bg-black/40 hover:translate-y-[-10px] transition-all duration-500 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                    <feat.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-3">{feat.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Keunggulan & Showcase */}
        <section className="py-24 bg-white/[0.02]">
           <div className="container-custom">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <h2 className="text-4xl md:text-5xl font-headline font-bold leading-tight">Mengapa Memilih <br/><span className="text-primary underline underline-offset-8">Nexvora Studio?</span></h2>
                       <p className="text-muted-foreground text-lg">Kami menghadirkan standar baru dalam penyediaan tools digital di Indonesia dengan fokus pada keamanan dan kecepatan.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {advantages.map((adv, i) => (
                         <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/30 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                               <Zap className="h-4 w-4 text-primary fill-primary" />
                            </div>
                            <span className="text-sm font-bold text-white/80">{adv}</span>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="relative">
                    {/* Hasil Kerja Slider Replacement */}
                    <ShowcaseSlider />
                    
                    {/* Floating Trust Badge */}
                    <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-xl p-6 rounded-3xl border border-primary/30 shadow-2xl animate-bounce z-20">
                       <p className="text-3xl font-headline font-bold text-primary">100%</p>
                       <p className="text-[10px] font-black uppercase text-white/60">Aman & Terpercaya</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Cara Kerja */}
        <section className="py-32">
           <div className="container-custom">
              <div className="text-center mb-20 space-y-3">
                 <h2 className="text-4xl font-headline font-bold">Proses Mulai Cepat</h2>
                 <p className="text-muted-foreground">Langkah mudah untuk mendominasi pasar digital.</p>
              </div>
              
              <div className="relative">
                 <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 hidden lg:block -translate-y-1/2" />
                 <div className="grid lg:grid-cols-4 gap-12 relative z-10">
                    {steps.map((s, i) => (
                      <div key={i} className="flex flex-col items-center text-center space-y-6">
                         <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-headline font-bold shadow-xl shadow-primary/30 border-4 border-black">
                            {i + 1}
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold">{s.title}</h4>
                            <p className="text-sm text-muted-foreground">{s.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* FAQ Section */}
        <section className="py-32">
           <div className="container-custom max-w-4xl mx-auto">
              <div className="text-center mb-16 space-y-3">
                 <h2 className="text-4xl font-headline font-bold">Frequently Asked Questions</h2>
                 <p className="text-muted-foreground">Segala hal yang perlu Anda ketahui tentang Nexvora Studio.</p>
              </div>
              
              <Accordion type="single" collapsible className="space-y-4">
                 {faqs.map((faq, i) => (
                   <AccordionItem key={i} value={`item-${i}`} className="border border-white/5 bg-black/40 rounded-2xl px-6">
                      <AccordionTrigger className="text-lg font-bold hover:no-underline hover:text-primary transition-colors py-6">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                   </AccordionItem>
                 ))}
              </Accordion>
           </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
           <div className="container-custom">
              <div className="rounded-[3rem] luxury-gradient p-12 md:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                 <h2 className="text-4xl md:text-6xl font-headline font-bold leading-tight relative z-10">Siap Mengembangkan <br/>Akun Anda?</h2>
                 <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto relative z-10">Gabung bersama member Nexvora Studio dan gunakan berbagai tools profesional yang tersedia.</p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10 pt-4">
                    <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-white text-primary hover:bg-white/90 font-black text-xl shadow-2xl group transition-all">
                       <Link href="/auth/register" className="flex items-center gap-2">DAFTAR SEKARANG <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform"/></Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-white/30 bg-white/5 text-white hover:bg-white/10 font-bold text-xl backdrop-blur-md">
                       <Link href="/auth/login">LOGIN AKUN</Link>
                    </Button>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 bg-black/60 relative z-10">
        <div className="container-custom grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              <span className="font-headline font-bold text-2xl uppercase tracking-tighter">Nexvora Studio</span>
            </div>
            <p className="text-muted-foreground text-base max-w-sm">Solusi digital terpadu untuk percepatan pertumbuhan akun media sosial dan marketplace di Indonesia.</p>
          </div>
          <div className="space-y-6">
            <h5 className="font-black text-xs uppercase tracking-widest text-white/40">Quick Menu</h5>
            <ul className="space-y-4">
              <li><Link href="/" className="text-sm font-bold text-white/60 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/auth/login" className="text-sm font-bold text-white/60 hover:text-primary transition-colors">Login</Link></li>
              <li><Link href="/auth/register" className="text-sm font-bold text-white/60 hover:text-primary transition-colors">Register</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h5 className="font-black text-xs uppercase tracking-widest text-white/40">Services</h5>
            <ul className="space-y-4">
              <li><Link href="/dashboard/marketplace" className="text-sm font-bold text-white/60 hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link href="/dashboard/topup" className="text-sm font-bold text-white/60 hover:text-primary transition-colors">Top Up Koin</Link></li>
              <li><a href={CONTACT_INFO.whatsapp_group} target="_blank" className="text-sm font-bold text-white/60 hover:text-primary transition-colors">Komunitas WA</a></li>
            </ul>
          </div>
        </div>
        <div className="container-custom mt-20 pt-8 border-t border-white/5 text-center text-muted-foreground text-xs uppercase font-black tracking-widest">
           &copy; {new Date().getFullYear()} NEXVORA STUDIO. ALL RIGHTS RESERVED.
        </div>
      </footer>

      <WhatsAppFloating />
    </div>
  )
}
