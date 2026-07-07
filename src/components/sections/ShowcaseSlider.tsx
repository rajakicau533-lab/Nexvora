"use client"

import React, { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const slides = [
  { url: "https://i.ibb.co/vRbs8Qy/Screenshot-20260707-194651.jpg", title: "Monitoring Trafik" },
  { url: "https://i.ibb.co/svjPX3pX/Screenshot-20260707-194706.jpg", title: "Dashboard Member" },
  { url: "https://i.ibb.co/m5pZZXBS/Screenshot-20260707-194730.jpg", title: "Statistik Platform" },
  { url: "https://i.ibb.co/RGsjSK9S/Screenshot-20260707-194809.jpg", title: "Aktivitas Pengguna" },
]

export function ShowcaseSlider() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return

    const intervalId = setInterval(() => {
      api.scrollNext()
    }, 4000)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })

    return () => clearInterval(intervalId)
  }, [api])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[9px] font-black uppercase tracking-widest px-3 py-1">
          🔥 Real Project
        </Badge>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[9px] font-black uppercase tracking-widest px-3 py-1">
          📈 Hasil Pengguna
        </Badge>
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[9px] font-black uppercase tracking-widest px-3 py-1">
          ⚡ Aktivitas Platform
        </Badge>
      </div>

      <Carousel 
        setApi={setApi}
        opts={{ align: "start", loop: true }}
        className="w-full relative group"
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="aspect-square md:aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative bg-white/5">
                 <img 
                    src={slide.url} 
                    alt={slide.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Hasil Kerja</p>
                       <h4 className="text-xl md:text-2xl font-headline font-bold text-white tracking-tight">{slide.title}</h4>
                    </div>
                 </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Buttons - Visible on Hover */}
        <div className="hidden md:block">
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/60 border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/60 border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary" />
        </div>

        {/* Custom Dot Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === i ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      </Carousel>
    </div>
  )
}
