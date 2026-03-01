import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import HeroImage from "@/components/layout/HeroImage";
import WhitePanel from "@/components/layout/WhitePanel";
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
          <div className="h-screen relative overflow-hidden">
            <WhitePanel />

            {/* Left content area */}
            <main className="relative w-full lg:w-[45%] px-6 md:px-10 lg:pl-[7.71vw] pt-32 lg:pt-[148px] pb-10 lg:pb-0 h-screen flex flex-col">
              <div className="flex-1 flex flex-col">{children}</div>
            </main>

            {/* Right hero illustration — absolutely positioned, bleeding off edges */}
            <HeroImage />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
