export type Artwork = {
  id: string;
  title: { ru: string; en: string };
  image: string;
  thumbnail?: string;
  logo?: string;
  sketch?: string;
  year?: string;
  tools?: string;
  resolution?: string;
  hours?: string;
  category: string;
  subcategory?: string;
  displayType?: "youtube" | "video" | "default";
  videoUrl?: string;
  objectPosition?: string;
  client?: string;
  clientName?: string;
  clientRole?: string;
  clientAvatar?: string;
  clientAvatarBg?: string;
  subscribers?: string;
  review?: { ru: string; en: string };
  reviewType?: "review" | "description";
  clientSocials?: { icon: string; url: string }[];
  contactId?: string; // reference to Contact.id — when set, client fields are resolved from contacts
  coworkers?: { id?: string; name: string; role?: string; avatar?: string; socials?: { icon: string; url: string }[] }[];
  createdAt?: string; // ISO date string, set when artwork is first saved via admin
};

const STATIC_CREATED_AT = "2026-03-03T00:00:00.000Z";

export const artworks: Artwork[] = ([] as Artwork[]).map((a) => ({ ...a, createdAt: a.createdAt ?? STATIC_CREATED_AT }));

export function getArtworksByCategory(category: string, subcategory?: string) {
  return artworks.filter((a) => {
    if (a.category !== category) return false;
    if (subcategory && a.subcategory !== subcategory) return false;
    return true;
  });
}
