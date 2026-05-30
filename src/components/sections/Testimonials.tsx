"use client"

import React, { useEffect, useState } from "react"
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  type CarouselApi 
} from "@/components/ui/carousel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  { name: "Budi Santoso", role: "TikTok Creator", content: "Nexvora sangat membantu menaikkan engagement video saya secara signifikan. Dashboardnya sangat mudah digunakan!", avatar: "https://picsum.photos/seed/1/100/100" },
  { name: "Siti Aminah", role: "Online Seller", content: "Layanan trafik shopeenya luar biasa. Penjualan toko saya meningkat drastis sejak pakai Nexvora Studio.", avatar: "https://picsum.photos/seed/2/100/100" },
  { name: "Andi Wijaya", role: "Digital Marketer", content: "Platform paling komplit untuk koin dan AI. Kualitas video AI-nya benar-benar premium.", avatar: "https://picsum.photos/seed/3/100/100" },
  { name: "Rina Kartika", role: "Content Creator", content: "Sistem referralnya transparan dan menguntungkan. CS adminnya juga sangat fast respon lewat WA.", avatar: "https://picsum.photos/seed/4/100/100" },
  { name: "Thomas Ade", role: "Business Owner", content: "Sangat direkomendasikan bagi siapa saja yang ingin serius di dunia digital marketing.", avatar: "https://picsum.photos/seed/5/100/100" },
  { name: "Fajri Ramadhan", role: "Entrepreneur", content: "Keamanan database Nexvora bikin tenang bisnis. Top up koin juga sangat cepat prosesnya.", avatar: "https://picsum.photos/seed/6/100/100" },
  { name: "Dewi Lestari", role: "Agency Owner", content: "Sudah pakai selama 3 bulan dan hasilnya konsisten. Trafiknya asli Indonesia dan organik.", avatar: "https://picsum.photos/seed/7/100/100" },
  { name: "Hendra Putra", role: "Live Streamer", content: "Materi pembelajarannya daging semua. Benar-benar ngebantu newbie buat berkembang.", avatar: "https://picsum.photos/seed/8/100/100" },
  { name: "Anita Sari", role: "Dropshipper", content: "Marketplace digitalnya punya produk yang sangat berkualitas dengan harga koin yang terjangkau.", avatar: "https://picsum.photos/seed/9/100/100" },
  { name: "Irfan Hakim", role: "SEO Specialist", content: "Nexvora Studio adalah standard baru platform digital di Indonesia. Modern dan sangat powerfull.", avatar: "https://picsum.photos/seed/10/100/100" },
]

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!api) return

    const intervalId = setInterval(() => {
      api.scrollNext()
    }, 2000)

    return () => clearInterval(intervalId)
  }, [api])

  return (
    <section id="testimonials" className="py-24 bg-background/50">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-headline font-bold">Apa Kata Mereka?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Lebih dari 10.000+ pengguna telah mempercayakan pertumbuhan digital mereka pada Nexvora Studio.
          </p>
        </div>

        <Carousel 
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((t, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 p-4">
                <div className="premium-card p-8 rounded-2xl h-full flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-foreground italic leading-relaxed">"{t.content}"</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={t.avatar} />
                      <AvatarFallback>{t.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
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
