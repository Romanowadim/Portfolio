import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import HeroImage from "@/components/layout/HeroImage";
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

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Header />
          <div className="min-h-screen pt-16 flex">
            {/* Left content area */}
            <main className="w-full lg:w-[34%] px-6 md:px-10 py-10 flex flex-col">
              <div className="flex-1">{children}</div>
            </main>

            {/* Right hero illustration area */}
            <aside className="hidden lg:block w-[66%] relative bg-bg-dark">
              <div className="sticky top-16 h-[calc(100vh-4rem)]">
                <HeroImage />
              </div>
            </aside>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
