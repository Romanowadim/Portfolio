export type Equipment = {
  id: string;
  name: string;
  brandIcon: string;
  image: string;
  specKeyWidth: number;
  specs: {
    key: string;
    value: string;
  }[];
};

export const equipment: Equipment[] = [
  {
    id: "imac",
    name: "IMAC 27-INCH",
    brandIcon: "/images/equipment/apple-logo.svg",
    image: "/images/equipment/imac.png",
    specKeyWidth: 60,
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
    specKeyWidth: 60,
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
    specKeyWidth: 105,
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
    specKeyWidth: 60,
    specs: [
      { key: "ios", value: "15.0" },
      { key: "cpu", value: "Apple M1" },
      { key: "ram", value: "8 Gb" },
      { key: "mem", value: "64 Gb" },
    ],
  },
];
