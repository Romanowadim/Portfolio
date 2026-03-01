const socials = [
  { name: "ArtStation", url: "https://www.artstation.com/", icon: "/images/social/artstation.svg" },
  { name: "VK", url: "https://vk.com/", icon: "/images/social/vk.svg" },
  { name: "Instagram", url: "https://instagram.com/", icon: "/images/social/instagram.svg" },
  { name: "YouTube", url: "https://youtube.com/", icon: "/images/social/youtube.svg" },
  { name: "Tumblr", url: "https://tumblr.com/", icon: "/images/social/tumblr.svg" },
  { name: "DeviantArt", url: "https://deviantart.com/", icon: "/images/social/deviantart.svg" },
  { name: "Behance", url: "https://behance.net/", icon: "/images/social/behance.svg" },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-[25px]">
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-5 h-5 hover:brightness-[0.667] transition-[filter]"
          aria-label={s.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.icon} alt={s.name} className="w-full h-full object-contain" />
        </a>
      ))}
    </div>
  );
}
