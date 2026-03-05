"use client";

import { useState, useEffect } from "react";

type Social = { name: string; url: string; icon: string };

const fallback: Social[] = [
  { name: "ArtStation", url: "https://www.artstation.com/", icon: "/images/social/artstation.svg" },
  { name: "VK", url: "https://vk.com/", icon: "/images/social/vk.svg" },
  { name: "Instagram", url: "https://instagram.com/", icon: "/images/social/instagram.svg" },
  { name: "YouTube", url: "https://youtube.com/", icon: "/images/social/youtube.svg" },
  { name: "Tumblr", url: "https://tumblr.com/", icon: "/images/social/tumblr.svg" },
  { name: "DeviantArt", url: "https://deviantart.com/", icon: "/images/social/deviantart.svg" },
  { name: "Behance", url: "https://behance.net/", icon: "/images/social/behance.svg" },
];

export default function SocialLinks() {
  const [socials, setSocials] = useState<Social[]>(fallback);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.socials) && d.socials.length > 0) setSocials(d.socials); })
      .catch(() => {});
  }, []);

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
          onClick={() => {
            fetch("/api/stats/social-click", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: s.name }),
            }).catch(() => {});
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.icon} alt={s.name} className="w-full h-full object-contain" />
        </a>
      ))}
    </div>
  );
}
