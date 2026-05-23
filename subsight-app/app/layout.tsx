import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subsight — AI subscription intelligence",
  description: "AI-powered subscription intelligence platform. Detect, analyze, and optimize your recurring payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
