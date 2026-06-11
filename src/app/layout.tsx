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

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>Nexvora Studio - Professional AI & Digital Growth Platform</title>
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
