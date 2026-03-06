export type Equipment = {
  id: string;
  name: string | { en: string; ru: string };
  brandIcon: string;
  image: string;
  specs: {
    key: string;
    value: string | { en: string; ru: string };
  }[];
};

/** Resolve name to string for a given locale (backward compatible with plain strings) */
export function equipmentName(item: Equipment, locale: string): string {
  if (typeof item.name === "string") return item.name;
  return locale === "ru" ? item.name.ru : item.name.en;
}

/** Resolve spec value to string for a given locale */
export function specValue(value: string | { en: string; ru: string }, locale: string): string {
  if (typeof value === "string") return value;
  return locale === "ru" ? value.ru : value.en;
}

export const equipment: Equipment[] = [
  {
    id: "imac",
    name: "IMAC 27-INCH",
    brandIcon: "/images/equipment/apple-logo.svg",
    image: "/images/equipment/imac.png",
    specs: [
      { key: "os", value: "macOS High Sierra" },
      { key: "cpu", value: "Intel Core i5 3,4 GHz" },
      { key: "gpu", value: "Nvidia GeForce GTX 780M 4 Gb" },
      { key: "ram", value: "16 Gb 1600 MHz DDR3" },
    ],
  },
  {
    id: "pc",
    name: "PC",
    brandIcon: "/images/equipment/windows-logo.svg",
    image: "/images/equipment/pc.png",
    specs: [
      { key: "os", value: "Windows 10" },
      { key: "cpu", value: "AMD Ryzen 7 2700X 3,7 GHz" },
      { key: "gpu", value: "Gigabyte RTX 3070 8 Gb" },
      { key: "ram", value: "16 Gb 3200 MHz DDR4" },
    ],
  },
  {
    id: "wacom",
    name: "WACOM CINTIQ 22HD",
    brandIcon: "/images/equipment/wacom-logo.svg",
    image: "/images/equipment/wacom.png",
    specs: [
      { key: "diagonal", value: "22-inch" },
      { key: "technology", value: "H-IPS LCD" },
      { key: "aspectRatio", value: "16:9" },
      { key: "resolution", value: "5080 lpi" },
    ],
  },
  {
    id: "ipad",
    name: "IPAD PRO 12,9-INCH",
    brandIcon: "/images/equipment/apple-logo.svg",
    image: "/images/equipment/ipad.png",
    specs: [
      { key: "ios", value: "15.0" },
      { key: "cpu", value: "Apple M1" },
      { key: "ram", value: "8 Gb" },
      { key: "mem", value: "64 Gb" },
    ],
  },
];
