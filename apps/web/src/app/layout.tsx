import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MswProvider } from "@/mocks/MswProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Get a J*b",
  description: "Job application tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <MswProvider>
        <div
          dangerouslySetInnerHTML={{
            __html: `<script id="theme-init">
              try {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            ${'</'}script>`,
          }}
        />
        {children}
        </MswProvider>
      </body>
    </html>
  );
}
