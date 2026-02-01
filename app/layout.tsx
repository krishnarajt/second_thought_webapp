import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Second Thought',
  description: 'Simple timetable app',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: [
    {
      rel: 'icon',
      url: '/second_thought_icon.svg',
      type: 'image/svg+xml',
    },
    {
      rel: 'icon',
      url: '/second_thought_icon.png',
      type: 'image/png',
      sizes: '32x32',
    },
    {
      rel: 'apple-touch-icon',
      url: '/second_thought_icon.png',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
