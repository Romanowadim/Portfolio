const socials = [
  { name: "ArtStation", url: "https://www.artstation.com/", icon: "AS" },
  { name: "VK", url: "https://vk.com/", icon: "VK" },
  { name: "Instagram", url: "https://instagram.com/", icon: "IG" },
  { name: "YouTube", url: "https://youtube.com/", icon: "YT" },
  { name: "Tumblr", url: "https://tumblr.com/", icon: "TB" },
  { name: "DeviantArt", url: "https://deviantart.com/", icon: "DA" },
  { name: "Behance", url: "https://behance.net/", icon: "BE" },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-4">
      {socials.map((s) => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-bg-dark flex items-center justify-center text-[10px] font-bold text-text-secondary hover:text-text hover:bg-border transition-colors"
          aria-label={s.name}
        >
          {s.icon}
        </a>
      ))}
    </div>
  );
}
