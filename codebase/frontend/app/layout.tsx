import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-main",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Multi-Agent Classroom Prototype | AI20K EdTech",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} ${jetBrainsMono.variable}`}>
      <body>
        <ToastProvider>
          <GlobalNav />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
