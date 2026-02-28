export type Artwork = {
  id: string;
  title: { ru: string; en: string };
  image: string;
  sketch?: string;
  category: "personal" | "orders" | "youtube" | "other" | "gamedev";
  subcategory?: "cg" | "lineart";
  client?: string;
};

export const artworks: Artwork[] = [
  {
    id: "1",
    title: { ru: "Работа 1", en: "Artwork 1" },
    image: "/images/artworks/artwork-1.jpg",
    sketch: "/images/artworks/artwork-1-sketch.jpg",
    category: "personal",
    subcategory: "cg",
  },
  {
    id: "2",
    title: { ru: "Работа 2", en: "Artwork 2" },
    image: "/images/artworks/artwork-2.jpg",
    category: "personal",
    subcategory: "cg",
  },
  {
    id: "3",
    title: { ru: "Работа 3", en: "Artwork 3" },
    image: "/images/artworks/artwork-3.jpg",
    category: "personal",
    subcategory: "cg",
  },
  {
    id: "4",
    title: { ru: "Работа 4", en: "Artwork 4" },
    image: "/images/artworks/artwork-4.jpg",
    category: "personal",
    subcategory: "lineart",
  },
  {
    id: "5",
    title: { ru: "Работа 5", en: "Artwork 5" },
    image: "/images/artworks/artwork-5.jpg",
    category: "personal",
    subcategory: "lineart",
  },
  {
    id: "6",
    title: { ru: "GTA Арт", en: "GTA Art" },
    image: "/images/artworks/artwork-6.jpg",
    sketch: "/images/artworks/artwork-6-sketch.jpg",
    category: "orders",
    client: "GTA",
  },
  {
    id: "7",
    title: { ru: "Pashgun", en: "Pashgun" },
    image: "/images/artworks/artwork-7.jpg",
    category: "orders",
    client: "Pashgun",
  },
  {
    id: "8",
    title: { ru: "WEPLEX", en: "WEPLEX" },
    image: "/images/artworks/artwork-8.jpg",
    category: "orders",
    client: "WEPLEX",
  },
  {
    id: "9",
    title: { ru: "YouTube Арт 1", en: "YouTube Art 1" },
    image: "/images/artworks/artwork-9.jpg",
    category: "youtube",
  },
  {
    id: "10",
    title: { ru: "YouTube Арт 2", en: "YouTube Art 2" },
    image: "/images/artworks/artwork-10.jpg",
    category: "youtube",
  },
];

export function getArtworksByCategory(category: string, subcategory?: string) {
  return artworks.filter((a) => {
    if (a.category !== category) return false;
    if (subcategory && a.subcategory !== subcategory) return false;
    return true;
  });
}
