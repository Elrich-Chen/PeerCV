import "./globals.css";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import PageTransition from "./components/PageTransition";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Peer-CV",
  description: "Resume community for peer reviews",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
          <PageTransition>{children}</PageTransition>
        </main>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
