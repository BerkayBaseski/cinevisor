import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CineVisor - AI Short Film Platform',
  description: 'Discover, create, and share AI-generated and human-made short films. A modern cinematic platform powered by artificial intelligence.',
  keywords: 'AI films, short films, cinema, video platform, AI generated movies',
  openGraph: {
    title: 'CineVisor - AI Short Film Platform',
    description: 'Discover AI-generated and human-made cinematic masterpieces',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main style={{ paddingTop: '68px' }}>
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
