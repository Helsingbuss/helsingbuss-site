import React, { useMemo } from "react";

type Props = {
  title?: string;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
  className?: string; // om du vill skicka vidare wrapper-klass
};

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function safeUrl(u: string) {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

/**
 * Tar en "vanlig" YouTube/Vimeo länk och gör om till embed.
 * Om länken redan är embed eller okänd, returnerar vi originalet.
 */
function toEmbedUrl(raw: string) {
  const u = safeUrl(raw);
  if (!u) return raw;

  const host = u.hostname.replace(/^www\./, "");

  // YouTube
  if (host === "youtube.com" || host === "m.youtube.com") {
    // watch?v=VIDEO_ID
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    // redan embed
    if (u.pathname.startsWith("/embed/")) return raw;
    return raw;
  }

  // youtu.be/VIDEO_ID
  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    return raw;
  }

  // Vimeo
  if (host === "vimeo.com") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    return raw;
  }

  // player.vimeo.com/video/...
  if (host === "player.vimeo.com") return raw;

  return raw;
}

export function TripHeroMedia({ title, heroImageUrl, heroVideoUrl, className }: Props) {
  const videoUrl = (heroVideoUrl ?? "").trim();
  const imageUrl = (heroImageUrl ?? "").trim();

  const embedUrl = useMemo(() => {
    if (!videoUrl) return "";
    if (isVideoFile(videoUrl)) return videoUrl; // direktfil -> <video>
    return toEmbedUrl(videoUrl); // youtube/vimeo -> <iframe>
  }, [videoUrl]);

  return (
    <div className={className}>
      {/* Viktigt: samma 16:9 box som du redan har (ändrar inte layouten) */}
      <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gray-100">
        {videoUrl ? (
          isVideoFile(embedUrl) ? (
            <video className="h-full w-full object-cover" controls playsInline preload="metadata">
              <source src={embedUrl} />
              Din webbläsare stödjer inte video.
            </video>
          ) : (
            <iframe
              className="h-full w-full"
              src={embedUrl}
              title={title ? `Video – ${title}` : "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title ?? "Hero"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            Ingen hero-media vald
          </div>
        )}
      </div>
    </div>
  );
}
