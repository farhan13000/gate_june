import type { ReactNode } from "react";
import LatexRenderer from "./LatexRenderer";
import ContentMediaGallery, {
  ContentMediaFigure,
  normalizeContentMedia,
  type ContentMedia,
} from "./ContentMediaGallery";

type ContentPart =
  | { type: "text"; value: string }
  | { type: "media"; index: number };

const mediaMarker = /\{\{\s*media\s*:\s*(\d+)\s*\}\}/gi;

function parseContent(content: string, assetCount: number): ContentPart[] {
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  mediaMarker.lastIndex = 0;
  while ((match = mediaMarker.exec(content))) {
    if (match.index > lastIndex) parts.push({ type: "text", value: content.slice(lastIndex, match.index) });

    const index = Number(match[1]);
    // Keep a mistyped marker visible instead of silently removing it.
    if (Number.isInteger(index) && index >= 0 && index < assetCount) {
      parts.push({ type: "media", index });
    } else {
      parts.push({ type: "text", value: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length || !parts.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }
  return parts;
}

function SideBySideMedia({
  asset,
  index,
  followingText,
  label,
}: {
  asset: ContentMedia;
  index: number;
  followingText: string;
  label: string;
}) {
  const figure = (
    <ContentMediaFigure
      asset={asset}
      label={label}
      index={index}
      className="w-full shrink-0 md:w-[min(42%,22rem)]"
    />
  );

  return (
    <div className="my-4 flex flex-col gap-4 md:flex-row md:items-start">
      {asset.placement === "left" && figure}
      <div className="min-w-0 flex-1">
        <LatexRenderer latex={followingText} />
      </div>
      {asset.placement === "right" && figure}
    </div>
  );
}

/**
 * Renders text and media as one reading flow. Put `{{media:0}}` in text to place
 * the first asset at that exact point. Side placements stack cleanly on mobile.
 */
export default function EmbeddedMediaContent({
  content,
  media,
  imageUrl,
  label = "Visual",
  className = "",
}: {
  content?: unknown;
  media?: unknown;
  imageUrl?: unknown;
  label?: string;
  className?: string;
}) {
  const text = typeof content === "string" ? content : content == null ? "" : String(content);
  const assets = normalizeContentMedia(media, imageUrl);
  const hasMarker = mediaMarker.test(text);
  mediaMarker.lastIndex = 0;

  if (!assets.length) return text ? <div className={className}><LatexRenderer latex={text} /></div> : null;

  // Existing content without a marker keeps its old, predictable visual-before-text layout.
  if (!hasMarker) {
    return (
      <div className={`space-y-4 ${className}`.trim()}>
        <ContentMediaGallery media={assets} label={label} />
        {text && <LatexRenderer latex={text} />}
      </div>
    );
  }

  const parts = parseContent(text, assets.length);
  const placed = new Set<number>();
  const rendered: ReactNode[] = [];

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    const part = parts[partIndex];
    if (part.type === "text") {
      if (part.value) rendered.push(<LatexRenderer key={`text-${partIndex}`} latex={part.value} />);
      continue;
    }

    const asset = assets[part.index];
    placed.add(part.index);
    const next = parts[partIndex + 1];
    const canShareRow = (asset.placement === "left" || asset.placement === "right") && next?.type === "text" && Boolean(next.value.trim());

    if (canShareRow) {
      rendered.push(
        <SideBySideMedia
          key={`media-${part.index}-${partIndex}`}
          asset={asset}
          index={part.index}
          followingText={next.value}
          label={label}
        />
      );
      partIndex += 1;
      continue;
    }

    rendered.push(
      <ContentMediaFigure
        key={`media-${part.index}-${partIndex}`}
        asset={asset}
        label={label}
        index={part.index}
        className={asset.placement === "full" ? "my-4 w-full" : "my-4 mx-auto w-full max-w-2xl"}
      />
    );
  }

  const unplaced = assets.filter((_, index) => !placed.has(index));
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {rendered}
      {unplaced.length > 0 && <ContentMediaGallery media={unplaced} label={label} className="pt-1" />}
    </div>
  );
}
