import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Opportunity Radar',
  description: 'Upcoming US events, scored for opportunity fit.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text font-sans">{children}</body>
    </html>
  );
}
