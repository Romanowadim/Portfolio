export type ImagePosition = {
  width: string;
  height: string;
  left: string;
  top: string;
};

export type Equipment = {
  id: string;
  name: string;
  brandIcon: string;
  image: string;
  imagePos: ImagePosition;
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
    imagePos: { width: "129.02%", height: "129.02%", left: "-14.12%", top: "-20.39%" },
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
    imagePos: { width: "87.84%", height: "87.84%", left: "6.08%", top: "0%" },
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
    imagePos: { width: "113.81%", height: "63.92%", left: "-6.71%", top: "12.55%" },
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
    imagePos: { width: "82.87%", height: "98.04%", left: "8.56%", top: "-5.1%" },
    specKeyWidth: 60,
    specs: [
      { key: "ios", value: "15.0" },
      { key: "cpu", value: "Apple M1" },
      { key: "ram", value: "8 Gb" },
      { key: "mem", value: "64 Gb" },
    ],
  },
];
