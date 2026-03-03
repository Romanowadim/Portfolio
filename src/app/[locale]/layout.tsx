import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import MainContent from "@/components/layout/MainContent";
import AdminProvider from "@/components/admin/AdminProvider";
import "@/app/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const h = await headers();
  const isAdmin = h.get("x-is-admin") === "true";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Hide header before React hydration when an artwork modal will open */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){if(location.search.indexOf('artwork=')>=0)document.documentElement.setAttribute('data-artwork-open','')})()` }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <AdminProvider initialIsAdmin={isAdmin}>
            <Header />
            <MainContent>{children}</MainContent>
          </AdminProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
