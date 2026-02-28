export type Equipment = {
  id: string;
  name: string;
  brand: string;
  image: string;
  specs: {
    key: string;
    value: string;
  }[];
};

export const equipment: Equipment[] = [
  {
    id: "imac",
    name: 'iMac 27"',
    brand: "Apple",
    image: "/images/equipment/imac.jpg",
    specs: [
      { key: "processor", value: "Intel Core i5" },
      { key: "memory", value: "16 GB" },
      { key: "storage", value: "512 GB SSD" },
      { key: "display", value: '27" Retina 5K' },
      { key: "graphics", value: "Radeon Pro 570X" },
    ],
  },
  {
    id: "pc",
    name: "Custom PC",
    brand: "Custom",
    image: "/images/equipment/pc.jpg",
    specs: [
      { key: "processor", value: "AMD Ryzen 7 5800X" },
      { key: "memory", value: "32 GB DDR4" },
      { key: "storage", value: "1 TB NVMe SSD" },
      { key: "graphics", value: "NVIDIA RTX 3070" },
    ],
  },
  {
    id: "wacom",
    name: "Wacom Cintiq 22",
    brand: "Wacom",
    image: "/images/equipment/wacom.jpg",
    specs: [
      { key: "size", value: '21.5"' },
      { key: "resolution", value: "1920 x 1080" },
    ],
  },
  {
    id: "ipad",
    name: 'iPad Pro 12.9"',
    brand: "Apple",
    image: "/images/equipment/ipad.jpg",
    specs: [
      { key: "processor", value: "Apple M1" },
      { key: "memory", value: "8 GB" },
      { key: "storage", value: "256 GB" },
      { key: "display", value: '12.9" Liquid Retina XDR' },
    ],
  },
];
