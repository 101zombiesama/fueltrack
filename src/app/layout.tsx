import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import { getSessionUser } from "@/lib/auth";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FuelTrack - Smart Food Tracker",
  description: "Track your macros with natural language powered by AI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-muted/30 font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {user && <Nav user={user} />}
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
