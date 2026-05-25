import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'BokaBarber | Premium Bokningssystem för Frisörsalonger',
  description: 'Hitta och boka Sveriges bästa frisörer och barbershops. Upptäck premiumtjänster, boka online på sekunder och upplev professionellt salongsstöd.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
