import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/components/games/engines/folder.css";
import { Providers } from "@/components/shared/Providers";
import { Toaster } from "@/components/ui/toast";
import { CookieBanner } from "@/components/shared/CookieBanner";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "EduPlay — Interactive language learning games",
  description: "SaaS platform for interactive language learning games and courses.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("eduplay-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${jakarta.variable} font-body min-h-screen`}>
        <Providers>{children}</Providers>
        <Toaster />
        <CookieBanner />
      </body>
    </html>
  );
}
