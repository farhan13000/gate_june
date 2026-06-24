import { useState } from "react";

export type ContentMedia = {
  url: string;
  alt?: string;
  caption?: string;
  kind?: "image" | "diagram";
  /** Where the asset sits when it is embedded with {{media:n}}. */
  placement?: "inline" | "left" | "right" | "full";
};

function isSafeMediaUrl(value: string): boolean {
  return /^(https?:\/\/|\/(?!\/)|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,)/i.test(value.trim());
}

/** Turns a Google Drive share/preview page into the image endpoint an <img> can request. */
function toEmbeddableMediaUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== "drive.google.com") return value;

    const fileId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || parsed.searchParams.get("id");
    return fileId ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}` : value;
  } catch {
    return value;
  }
}

/** Public remote images are fetched through the app's validated, cacheable media endpoint. */
function getRenderableMediaUrl(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_BASE || "";
  return `${apiBase}/api/media/image?src=${encodeURIComponent(value)}`;
}

/** Converts the new media shape plus legacy image fields into safe display assets. */
export function normalizeContentMedia(value: unknown, legacyImageUrl?: unknown): ContentMedia[] {
  const flatten = (entry: unknown): unknown[] => Array.isArray(entry)
    ? entry.flatMap(flatten)
    : entry ? [entry] : [];
  const values = [value, legacyImageUrl].flatMap(flatten);
  const assets: ContentMedia[] = [];

  for (const entry of values) {
    if (typeof entry === "string") {
      if (isSafeMediaUrl(entry)) assets.push({ url: toEmbeddableMediaUrl(entry.trim()), kind: "image" });
      continue;
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    const rawUrl = item.url ?? item.src ?? item.imageUrl;
    if (typeof rawUrl !== "string" || !isSafeMediaUrl(rawUrl)) continue;
    assets.push({
      url: toEmbeddableMediaUrl(rawUrl.trim()),
      ...(typeof item.alt === "string" && item.alt.trim() ? { alt: item.alt.trim() } : {}),
      ...(typeof item.caption === "string" && item.caption.trim() ? { caption: item.caption.trim() } : {}),
      kind: item.kind === "diagram" ? "diagram" : "image",
      placement: ["left", "right", "full"].includes(String(item.placement))
        ? item.placement as ContentMedia["placement"]
        : "inline",
    });
  }

  return assets.filter((asset, index, list) => list.findIndex((candidate) => candidate.url === asset.url) === index);
}

/** A single accessible media card. Exported so embedded content can position it precisely. */
export function ContentMediaFigure({
  asset,
  label = "Visual",
  index = 0,
  className = "",
}: {
  asset: ContentMedia;
  label?: string;
  index?: number;
  className?: string;
}) {
  const [hasLoadError, setHasLoadError] = useState(false);

  return (
    <figure className={`overflow-hidden rounded-sm border border-border bg-secondary/15 p-2 ${className}`.trim()}>
      {hasLoadError ? (
        <div className="flex min-h-28 flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">This image is unavailable</span>
          <span>The media server could not retrieve the source image.</span>
        </div>
      ) : (
        <img
          src={getRenderableMediaUrl(asset.url)}
          alt={asset.alt || `${asset.kind === "diagram" ? "Diagram" : label} ${index + 1}`}
          loading="lazy"
          onError={() => setHasLoadError(true)}
          className="mx-auto max-h-[32rem] max-w-full rounded-sm object-contain"
        />
      )}
      {(asset.caption || asset.kind === "diagram") && (
        <figcaption className="px-1 pt-2 text-center text-xs leading-relaxed text-muted-foreground">
          {asset.caption || `Diagram ${index + 1}`}
        </figcaption>
      )}
    </figure>
  );
}

export default function ContentMediaGallery({
  media,
  imageUrl,
  label = "Visual",
  className = "",
}: {
  media?: unknown;
  imageUrl?: unknown;
  label?: string;
  className?: string;
}) {
  const assets = normalizeContentMedia(media, imageUrl);
  if (!assets.length) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {assets.map((asset, index) => (
        <ContentMediaFigure key={asset.url} asset={asset} label={label} index={index} />
      ))}
    </div>
  );
}
