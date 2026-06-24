import { Request, Response } from "express";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { pipeline, Readable } from "node:stream";
import cloudinary, { cloudinaryFolder, isCloudinaryConfigured } from "../config/cloudinary";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 4;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_UPLOAD_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type UploadedMediaKind = "image" | "diagram";
type UploadedMediaPlacement = "inline" | "left" | "right" | "full";

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeUploadKind(value: unknown): UploadedMediaKind {
  return value === "diagram" ? "diagram" : "image";
}

function normalizeUploadPlacement(value: unknown): UploadedMediaPlacement {
  return ["left", "right", "full"].includes(String(value))
    ? value as UploadedMediaPlacement
    : "inline";
}

/** Receives one admin-selected diagram and streams it to Cloudinary. */
export const uploadQuestionMedia = async (req: Request, res: Response): Promise<void> => {
  if (!isCloudinaryConfigured()) {
    res.status(503).json({
      message: "Image uploads are not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the backend environment.",
    });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ message: "Choose a PNG, JPEG, or WebP image up to 5 MB." });
    return;
  }
  if (!ACCEPTED_UPLOAD_TYPES.has(file.mimetype) || !file.buffer?.length) {
    res.status(400).json({ message: "Only PNG, JPEG, and WebP images are supported." });
    return;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    res.status(400).json({ message: "Images must be 5 MB or smaller." });
    return;
  }

  const alt = cleanText(req.body.alt, 240);
  const caption = cleanText(req.body.caption, 300);
  const kind = normalizeUploadKind(req.body.kind);
  const placement = normalizeUploadPlacement(req.body.placement);

  try {
    const uploaded = await new Promise<{ secure_url: string; public_id: string; width?: number; height?: number; format?: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: cloudinaryFolder,
          resource_type: "image",
          allowed_formats: ["png", "jpg", "jpeg", "webp"],
          use_filename: false,
          unique_filename: true,
          overwrite: false,
          tags: ["gate-da", "question-media"],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary did not return an uploaded asset."));
            return;
          }
          resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    // Store a delivery URL, not the original asset URL: diagrams are capped at
    // a sensible size and Cloudinary negotiates a modern image format per user.
    const deliveryUrl = cloudinary.url(uploaded.public_id, {
      secure: true,
      transformation: [
        { width: 1800, height: 1800, crop: "limit" },
        { fetch_format: "auto", quality: "auto" },
      ],
    });

    res.status(201).json({
      media: {
        url: deliveryUrl,
        publicId: uploaded.public_id,
        alt,
        caption,
        kind,
        placement,
        ...(uploaded.width ? { width: uploaded.width } : {}),
        ...(uploaded.height ? { height: uploaded.height } : {}),
        ...(uploaded.format ? { format: uploaded.format } : {}),
      },
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    res.status(502).json({ message: "The image host could not store this file. Please try again." });
  }
};

function normalizeGoogleDriveUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== "drive.google.com") return value;
    const fileId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || parsed.searchParams.get("id");
    return fileId ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}` : value;
  } catch {
    return value;
  }
}

function isPublicIp(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    return !(
      normalized === "::" || normalized === "::1" ||
      normalized.startsWith("fc") || normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }
  return false;
}

async function ensureSafePublicUrl(value: string): Promise<URL> {
  const parsed = new URL(normalizeGoogleDriveUrl(value));
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || !parsed.hostname) {
    throw new Error("Only public HTTPS image URLs are supported.");
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("Local addresses are not allowed.");
  }

  const addresses = await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("The image host is not publicly reachable.");
  }
  return parsed;
}

async function fetchImage(source: string): Promise<globalThis.Response> {
  let url = await ensureSafePublicUrl(source);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) throw new Error("The image host redirected too many times.");
      url = await ensureSafePublicUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) throw new Error("The image host did not return a usable image.");
    const contentType = response.headers.get("content-type") || "";
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new Error("The supplied URL did not return an image.");
    }
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
      throw new Error("The image is larger than 10 MB.");
    }
    return response;
  }

  throw new Error("Unable to fetch image.");
}

/** Streams verified public images from the server origin with browser/CDN caching. */
export const proxyImage = async (req: Request, res: Response): Promise<void> => {
  const source = typeof req.query.src === "string" ? req.query.src : "";
  if (!source || source.length > 2_048) {
    res.status(400).json({ message: "A valid image source is required." });
    return;
  }

  try {
    const response = await fetchImage(source);
    if (!response.body) throw new Error("The image response had no content.");

    res.status(200);
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/*");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Disposition", "inline");
    const contentLength = response.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    pipeline(Readable.fromWeb(response.body as never), res, (streamError) => {
      // `pipeline` observes both source and client-stream failures. Do not
      // throw from this callback: a missing external image must never crash
      // the Node process.
      if (streamError && !res.headersSent) res.status(502).end();
    });
  } catch (error) {
    res.status(422).json({ message: error instanceof Error ? error.message : "Image could not be fetched." });
  }
};
