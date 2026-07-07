'use client';

import './globals.css';
import { initializeFirebase, FirebaseClientProvider } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { isFirebaseConfigured } from '@/firebase/config';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const { firebaseApp, firestore, auth } = initializeFirebase();

function ReferralTracker() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      sessionStorage.setItem('nexvora_ref', ref);
      console.log('Referral captured:', ref);
    }
  }, [searchParams]);
  
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseConfigured && pathname !== '/setup') {
      router.push('/setup');
    }
  }, [pathname, router]);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Nexvora Studio",
    "url": "https://nexvora.com",
    "logo": "https://nexvora.com/logo.png",
    "description": "Platform digital untuk membantu creator, affiliate, seller dan pebisnis online meningkatkan performa akun dan penjualan dengan berbagai tools otomatis.",
    "sameAs": [
      "https://facebook.com/nexvorastudio",
      "https://instagram.com/nexvorastudio",
      "https://tiktok.com/@nexvorastudio"
    ]
  };

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* SEO Metadata */}
        <title>Nexvora Studio - Platform Tools Affiliate dan Trafik Digital</title>
        <meta name="description" content="Nexvora Studio menyediakan layanan trafik digital, tools affiliate, komunitas belajar dan berbagai fitur untuk membantu creator dan seller berkembang." />
        <meta name="keywords" content="booster shopee, trafik tiktok, tools affiliate, nexvora studio, digital marketing indonesia, jasa followers shopee, koin nexvora" />
        <link rel="canonical" href="https://nexvora.com" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nexvora.com" />
        <meta property="og:title" content="Nexvora Studio - Platform Tools Affiliate dan Trafik Digital" />
        <meta property="og:description" content="Tingkatkan performa akun Shopee & TikTok Anda dengan sistem otomatis Nexvora Studio." />
        <meta property="og:image" content="https://picsum.photos/seed/nexvora-seo/1200/630" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://nexvora.com" />
        <meta property="twitter:title" content="Nexvora Studio - Platform Tools Affiliate dan Trafik Digital" />
        <meta property="twitter:description" content="Platform tools digital terbaik untuk kreator & seller Indonesia." />
        <meta property="twitter:image" content="https://picsum.photos/seed/nexvora-seo/1200/630" />

        {/* Search Engine Robots */}
        <meta name="robots" content="index, follow" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        {isFirebaseConfigured && firebaseApp && firestore && auth ? (
          <FirebaseClientProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0F0F0F]">
             {pathname === '/setup' ? children : (
               <div className="text-center space-y-6">
                 <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                   <span className="text-4xl text-primary">⚙️</span>
                 </div>
                 <h1 className="text-2xl font-headline font-bold text-white">Konfigurasi Diperlukan</h1>
                 <p className="text-muted-foreground max-w-md mx-auto">
                   Aplikasi belum terhubung ke Firebase. Silakan masukkan API Key Anda di halaman setup.
                 </p>
                 <button 
                   onClick={() => router.push('/setup')}
                   className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                 >
                   Buka Panel Setup
                 </button>
               </div>
             )}
          </div>
        )}
      </body>
    </html>
  );
}
