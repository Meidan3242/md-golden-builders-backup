import { describe, expect, it } from "vitest";
import { checkUpload, sniff } from "@/lib/upload-rules";

const bytes = (...parts: (number[] | string)[]) => {
  const out: number[] = [];
  for (const p of parts) typeof p === "string" ? out.push(...[...p].map((c) => c.charCodeAt(0))) : out.push(...p);
  while (out.length < 64) out.push(0);
  return new Uint8Array(out);
};
const file = (b: Uint8Array, name: string, type: string) => new File([b], name, { type });

describe("upload rules: decided by the file's bytes, not its name or type", () => {
  it("recognises photos, videos, PDFs and Office files", () => {
    expect(sniff(bytes([0xff, 0xd8, 0xff, 0xe0])))?.toEqual({ kind: "image", mime: "image/jpeg" });
    expect(sniff(bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(sniff(bytes("RIFF", [0, 0, 0, 0], "WEBP"))?.mime).toBe("image/webp");
    expect(sniff(bytes([0, 0, 0, 0x18], "ftypheic"))?.mime).toBe("image/heic");
    expect(sniff(bytes([0, 0, 0, 0x18], "ftypqt  "))?.kind).toBe("video");
    expect(sniff(bytes([0, 0, 0, 0x18], "ftypisom"))?.mime).toBe("video/mp4");
    expect(sniff(bytes("%PDF-1.7"))?.kind).toBe("pdf");
    expect(sniff(bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))?.kind).toBe("office");
  });

  it("rejects SVG, HTML, scripts and anything unknown", () => {
    expect(sniff(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(sniff(bytes("<!DOCTYPE html><script>alert(1)</script>"))).toBeNull();
    expect(sniff(bytes("MZ"))).toBeNull(); // .exe
    expect(sniff(bytes([0x50, 0x4b, 0x03, 0x04], "random.zip"))).toBeNull(); // a plain zip is not an Office file
  });

  it("a fake 'photo' (HTML named .jpg with an image type) is refused", async () => {
    const r = await checkUpload(file(bytes("<html><script>x</script></html>"), "photo.jpg", "image/jpeg"), ["image"]);
    expect(r.ok).toBe(false);
  });

  it("only the kinds an upload allows are accepted, with the type taken from the bytes", async () => {
    const pdf = file(bytes("%PDF-1.4"), "estimate.pdf", "text/html");
    expect(await checkUpload(pdf, ["pdf"])).toEqual({ ok: true, mime: "application/pdf", kind: "pdf" });
    expect((await checkUpload(pdf, ["image"])).ok).toBe(false); // an estimate photo can't be a PDF
  });
});
