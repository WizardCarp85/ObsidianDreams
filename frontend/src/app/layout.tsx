import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ObsidianDreams — Your Personal Dream Journal",
  description:
    "Understand the stories your mind tells at night. Log, organize, and explore patterns in your dreams with AI-powered insights.",
  keywords: ["dream journal", "lucid dreams", "dream tracker", "sleep journal"],
  openGraph: {
    title: "ObsidianDreams",
    description: "Understand the stories your mind tells at night.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b1024" />
      </head>
      <body>{children}</body>
    </html>
  );
}
