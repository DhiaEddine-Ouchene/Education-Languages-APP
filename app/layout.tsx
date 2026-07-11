import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "EduPlay — Build and sell interactive language learning games",
  description: "White-label SaaS platform for language learning games and courses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jakarta.variable} font-body min-h-screen`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
