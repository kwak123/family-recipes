import type { Metadata } from "next";
import Nav from "@/components/Nav/Nav";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Family Recipes",
  description: "Weekly meal planning and grocery list generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
