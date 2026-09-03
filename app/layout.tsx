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
  title: {
    default: "LingoKit — AI-assisted language teaching games & courses",
    template: "%s · LingoKit",
  },
  description:
    "LingoKit is an AI-assisted platform for language teachers to build interactive vocabulary and grammar games and courses for their classes.",
  applicationName: "LingoKit",
  openGraph: {
    type: "website",
    siteName: "LingoKit",
    title: "LingoKit — AI-assisted language teaching games & courses",
    description:
      "An AI-assisted platform for language teachers to build interactive vocabulary and grammar games and courses for their classes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LingoKit — AI-assisted language teaching games & courses",
    description:
      "An AI-assisted platform for language teachers to build interactive vocabulary and grammar games and courses for their classes.",
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("lingokit-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

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
