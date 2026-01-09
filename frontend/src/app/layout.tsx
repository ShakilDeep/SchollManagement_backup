import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EduCore - School Management System",
  description: "Comprehensive school management system with student information, attendance, timetable, exams, staff management, library, and more. Built with Next.js, TypeScript, and shadcn/ui.",
  keywords: ["EduCore", "School Management", "Education", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Student Information System", "Attendance Tracking", "Exam Management"],
  authors: [{ name: "EduCore Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "EduCore - School Management System",
    description: "Modern school management system with comprehensive features for educational institutions",
    url: "https://chat.z.ai",
    siteName: "EduCore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduCore - School Management System",
    description: "Comprehensive school management platform for educational institutions",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
