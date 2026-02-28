import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vadim Romanov — Portfolio",
  description: "Professional Artist & Design Specialist",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
