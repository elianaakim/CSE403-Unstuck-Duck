import type { Metadata } from "next";
import { Bebas_Neue, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/Components/NavbarWrapper";
import { Providers } from "@/Components/Providers";
import { AuthProvider } from "@/supabase/authcontext";
import { ThemeProvider } from "next-themes";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Unstuck Duck",
  description: "Teach concepts to a rubber duck",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${bebasNeue.variable} ${dmMono.variable} ${dmSans.variable}`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
        >
          <AuthProvider>
            <Providers>
              <NavbarWrapper />
              {children}
            </Providers>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
