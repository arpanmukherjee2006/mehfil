import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/context/PlayerContext";
import { LibraryProvider } from "@/context/LibraryContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mehfile - Premium Music Streaming",
  description: "Experience premium music streaming with glassmorphism aesthetics. Powered by YouTube and MongoDB.",
  keywords: ["Music", "Streaming", "Bollywood", "Lofi", "Aesthetic", "Spotify Clone", "Apple Music Clone", "Mehfile"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100 overflow-hidden">
        <PlayerProvider>
          <LibraryProvider>
            {children}
          </LibraryProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
