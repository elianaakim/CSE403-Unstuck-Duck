import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/Components/NavbarWrapper";
import { Providers } from "@/Components/Providers";
import { AuthProvider } from "@/supabase/authcontext";
import { ThemeProvider } from "next-themes";

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
      <body suppressHydrationWarning>
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
