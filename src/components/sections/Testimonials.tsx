"use client"

import React, { useEffect, useState } from "react"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"

const testimonials = [
  { name: "Budi Santoso", role: "TikTok Creator", content: "Nexvora sangat membantu menaikkan engagement video saya secara signifikan. Dashboardnya sangat mudah digunakan!", avatar: "https://picsum.photos/seed/t1/100/100" },
  { name: "Siti Aminah", role: "Online Seller", content: "Layanan trafik shopeenya luar biasa. Penjualan toko saya meningkat drastis sejak pakai Nexvora Studio.", avatar: "https://picsum.photos/seed/t2/100/100" },
  { name: "Andi Wijaya", role: "Digital Marketer", content: "Platform paling komplit untuk koin dan AI. Kualitas layanan trafiknya benar-benar premium.", avatar: "https://picsum.photos/seed/t3/100/100" },
  { name: "Rina Kartika", role: "Content Creator", content: "Sistem koinnya transparan dan menguntungkan. CS adminnya juga sangat fast respon lewat WhatsApp.", avatar: "https://picsum.photos/seed/t4/100/100" },
  { name: "Thomas Ade", role: "Business Owner", content: "Sangat direkomendasikan bagi siapa saja yang ingin serius di dunia digital marketing.", avatar: "https://picsum.photos/seed/t5/100/100" },
  { name: "Fajri Ramadhan", role: "Entrepreneur", content: "Keamanan database Nexvora bikin tenang bisnis. Top up koin juga sangat cepat prosesnya.", avatar: "https://picsum.photos/seed/t6/100/100" },
  { name: "Dewi Lestari", role: "Agency Owner", content: "Sudah pakai selama 3 bulan dan hasilnya konsisten. Trafiknya asli Indonesia dan organik.", avatar: "https://picsum.photos/seed/t7/100/100" },
  { name: "Hendra Putra", role: "Live Streamer", content: "Materi pembelajarannya daging semua. Benar-benar ngebantu newbie buat berkembang.", avatar: "https://picsum.photos/seed/t8/100/100" },
]

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) return

    const intervalId = setInterval(() => {
      api.scrollNext()
    }, 3000)

    return () => clearInterval(intervalId)
  }, [api])

  return (
    <section id="testimonials" className="py-16 md:py-32 bg-background/50 relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-primary/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

      <div className="container-custom">
        <div className="text-center mb-12 md:mb-20 space-y-2 md:space-y-4">
          <h2 className="text-2xl md:text-5xl font-headline font-bold">Apa Kata Mereka?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-lg">
            Lebih dari 10.000+ pesanan telah diproses dengan tingkat kepuasan yang luar biasa.
          </p>
        </div>

        <Carousel 
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full relative z-10"
        >
          <CarouselContent className="-ml-4 md:-ml-6">
            {testimonials.map((t, index) => (
              <CarouselItem key={index} className="pl-4 md:pl-6 basis-full md:basis-1/2 lg:basis-1/3">
                <div className="premium-card p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] h-full flex flex-col justify-between space-y-6 md:space-y-8 bg-black/60 relative group border-white/5 hover:border-primary/30 transition-all duration-500">
                  <div className="absolute top-4 right-6 md:top-6 md:right-8 opacity-10 group-hover:opacity-30 transition-opacity">
                     <Quote className="h-8 w-8 md:h-12 md:w-12 text-primary rotate-180" />
                  </div>
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-white/80 italic leading-relaxed text-sm md:text-lg font-medium">"{t.content}"</p>
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-4 pt-4 border-t border-white/5">
                    <Avatar className="h-10 w-10 md:h-14 md:w-14 border-2 border-primary/20 shadow-xl">
                      <AvatarImage src={t.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black">{t.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white text-sm md:text-lg">{t.name}</p>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary">{t.role}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}