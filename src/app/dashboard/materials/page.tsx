"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayCircle, BookOpen, GraduationCap, ExternalLink } from "lucide-react"
import { useFirestore, useCollection } from "@/firebase"
import { collection } from "firebase/firestore"

export default function MaterialsPage() {
  const db = useFirestore()

  const materialsQuery = React.useMemo(() => {
    if (!db) return null
    return collection(db, "materials")
  }, [db])

  const { data: materials, loading } = useCollection<any>(materialsQuery)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-headline font-bold">Materi Belajar 📚</h2>
        <p className="text-muted-foreground">Tingkatkan skill digital marketing Anda dengan materi eksklusif Nexvora.</p>
      </div>

      {!materials || materials.length === 0 ? (
        <Card className="premium-card p-20 text-center border-dashed">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Materi Belajar Segera Hadir</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Admin kami sedang mempersiapkan konten berkualitas untuk Anda. Pastikan untuk mengecek halaman ini secara berkala.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {materials.map((item) => (
            <Card key={item.id} className="premium-card flex flex-col md:flex-row overflow-hidden rounded-3xl">
              <div className="md:w-1/3 relative h-48 md:h-auto">
                <img 
                  src={item.thumbnailUrl || "https://picsum.photos/seed/material/400/600"} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <PlayCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="md:w-2/3 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">Eksklusif Creator</Badge>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{item.description}</CardDescription>
                </div>
                <Button asChild className="w-full md:w-fit luxury-gradient rounded-xl">
                  <a href={item.contentUrl} target="_blank" rel="noopener noreferrer">
                    Buka Materi <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
