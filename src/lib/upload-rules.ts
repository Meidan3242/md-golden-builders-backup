// What may be uploaded, decided from the file's first bytes — the name and the browser's type can be anything.
// No SVG, HTML, scripts or archives: only photos, videos, PDFs and Office documents.
export type FileKind = "image" | "video" | "pdf" | "office";
export type Sniffed = { kind: FileKind; mime: string };

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
const starts = (b: Uint8Array, ...sig: number[]) => sig.every((x, i) => b[i] === x);

export function sniff(b: Uint8Array): Sniffed | null {
  if (b.length < 12) return null;
  if (starts(b, 0xff, 0xd8, 0xff)) return { kind: "image", mime: "image/jpeg" };
  if (starts(b, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { kind: "image", mime: "image/png" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return { kind: "image", mime: "image/webp" };
  if (ascii(b, 0, 4) === "GIF8") return { kind: "image", mime: "image/gif" };
  if (ascii(b, 0, 5) === "%PDF-") return { kind: "pdf", mime: "application/pdf" };
  if (ascii(b, 4, 8) === "ftyp") {
    const brand = ascii(b, 8, 12).toLowerCase();
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) return { kind: "image", mime: "image/heic" };
    if (brand.startsWith("qt")) return { kind: "video", mime: "video/quicktime" };
    if (["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "m4v ", "dash", "3gp4", "3gp5", "3g2a"].includes(brand)) return { kind: "video", mime: "video/mp4" };
    return null;
  }
  if (starts(b, 0x1a, 0x45, 0xdf, 0xa3)) return { kind: "video", mime: "video/webm" };
  // Word / Excel: new (.docx/.xlsx = zip with [Content_Types].xml) and old (.doc/.xls = OLE).
  if (starts(b, 0x50, 0x4b, 0x03, 0x04) && ascii(b, 30, 49) === "[Content_Types].xml") return { kind: "office", mime: "application/vnd.openxmlformats-officedocument" };
  if (starts(b, 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)) return { kind: "office", mime: "application/msword" };
  return null;
}

/** Reads the start of an uploaded file and checks it against what this upload accepts. */
export async function checkUpload(file: File, allowed: FileKind[]): Promise<{ ok: true; mime: string; kind: FileKind } | { ok: false; error: string }> {
  const s = sniff(new Uint8Array(await file.slice(0, 64).arrayBuffer()));
  if (!s || !allowed.includes(s.kind)) {
    const what = allowed.map((k) => ({ image: "photos", video: "videos", pdf: "PDFs", office: "Word / Excel files" })[k]).join(", ");
    return { ok: false, error: `${file.name || "This file"}: only ${what} can be uploaded here.` };
  }
  // A precise type for Office files from the name (the bytes only say "Office").
  const mime = s.kind === "office" ? (officeMime(file.name) ?? s.mime) : s.mime;
  return { ok: true, mime, kind: s.kind };
}

function officeMime(name: string) {
  const ext = name.toLowerCase().split(".").pop();
  return (
    {
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      doc: "application/msword",
      xls: "application/vnd.ms-excel",
    } as Record<string, string>
  )[ext ?? ""];
}
