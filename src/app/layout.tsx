import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: {
    default: "Career Nexus — Discover Your Potential. Build Your Path. Define Your Future.",
    template: "%s · Career Nexus",
  },
  description:
    "An intelligent, personalized career development ecosystem: profile, skills, documents, career analysis, custom roadmaps, an AI assistant and a résumé builder that works for every profession.",
  applicationName: "Career Nexus",
};

export const viewport: Viewport = {
  themeColor: "#0d1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-page text-ink-800 antialiased">
        {/* One toast provider for the whole app, so success/error feedback survives page transitions. */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
