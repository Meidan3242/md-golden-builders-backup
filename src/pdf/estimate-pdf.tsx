import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, Font, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { RECENT_WORK, TRADES } from "@/components/formal-estimate";
import { COMPANY } from "@/lib/demo-docs";
import type { Estimate } from "@/lib/estimates";
import { estimateDoc, type EstimateDoc } from "@/lib/estimate-doc";
import { dateLong, money } from "@/lib/format";
import { signedUrl } from "@/lib/storage";

// The estimate as a real PDF, made on the server — the same file whether it's downloaded by us or by the customer.
// Every block grows with its text and continues on the next page; nothing has a fixed height, nothing is cut.

const ROOT = process.cwd();
const fontFile = (f: string) => path.join(ROOT, "src/pdf/fonts", f);
Font.register({ family: "Serif", fonts: [{ src: fontFile("LiberationSerif-Regular.ttf") }, { src: fontFile("LiberationSerif-Bold.ttf"), fontWeight: "bold" }] });
Font.register({ family: "Sans", fonts: [{ src: fontFile("LiberationSans-Regular.ttf") }, { src: fontFile("LiberationSans-Bold.ttf"), fontWeight: "bold" }, { src: fontFile("LiberationSans-Italic.ttf"), fontStyle: "italic" }] });
// Symbols the text fonts don't have (✓, arrows, …) come from DejaVu instead of silently disappearing.
Font.register({ family: "Symbols", fonts: [{ src: fontFile("DejaVuSans.ttf") }, { src: fontFile("DejaVuSans.ttf"), fontWeight: "bold" }, { src: fontFile("DejaVuSans.ttf"), fontStyle: "italic" }] });
// Normal words are never hyphenated. A very long "word" (a link, a model number) may break into pieces so it wraps at
// the edge of the page instead of running off it — the PDF engine marks such a break with a hyphen.
Font.registerHyphenationCallback((word) => (word.length > 28 ? word.match(/.{1,20}/gu) ?? [word] : [word]));
const GOLD = "#b8902f";
const INK = "#1c1c1c";
const GREY = "#555555";
const LIGHT = "#e8e3d8";

const s = StyleSheet.create({
  page: { fontFamily: ["Sans", "Symbols"], fontSize: 10, color: INK, paddingTop: 40, paddingBottom: 56, paddingHorizontal: 46, lineHeight: 1.35 },
  serif: { fontFamily: ["Serif", "Symbols"] },
  label: { fontSize: 7.5, fontWeight: "bold", letterSpacing: 1.4, color: "#8a6a1f", textTransform: "uppercase" },
  muted: { color: GREY },
  h2: { fontFamily: ["Serif", "Symbols"], fontWeight: "bold", fontSize: 13.5, borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 3, marginBottom: 2 },
  section: { marginTop: 20 },
  row: { flexDirection: "row" },
  no: { width: 22, color: "#777777" },
  amount: { width: 84, textAlign: "right" },
  footer: { position: "absolute", left: 46, right: 46, bottom: 22, borderTopWidth: 1.5, borderTopColor: GOLD, paddingTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: "#777777" },
});

type Img = Buffer | null;
const read = (p: string): Promise<Img> => readFile(path.join(ROOT, "public", p)).catch(() => null);
async function photo(id: string): Promise<Img> {
  try {
    const url = await signedUrl("estimates", `r2:${id}`);
    if (!url) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** Lines up to this length are kept whole on one page (with their heading); longer ones flow across pages. */
const KEEP = 600;

/**
 * The scope as a flat list of blocks, one after another — no nesting. The PDF engine splits a flat list across pages
 * reliably (nested blocks overlapped at page breaks). A section line (No. · name · amount) is kept together with its
 * first step's name and first line, so a heading never sits alone at the bottom of a page.
 */
function scopeBlocks(d: EstimateDoc, photos: Map<string, Img>) {
  const out: React.ReactNode[] = [];
  const indent = { marginLeft: 22, marginRight: 94 };
  d.jobs.forEach((j, i) => {
    const head = (
      <View style={[s.row, { borderTopWidth: i ? 0.75 : 0, borderTopColor: LIGHT, paddingTop: 8 }]}>
        <Text style={s.no}>{i + 1}</Text>
        <Text style={{ flex: 1, paddingRight: 10, fontWeight: "bold", fontSize: 10.5 }}>{j.title}</Text>
        <Text style={[s.amount, { fontWeight: "bold" }]}>{j.price ? money(j.price) : ""}</Text>
      </View>
    );
    if (!j.steps.length) out.push(<View key={`h${i}`} wrap={false} style={{ paddingBottom: 8 }}>{head}</View>);
    j.steps.forEach((st, k) => {
      const firstShort = st.items[0] !== undefined && st.items[0].length <= KEEP;
      out.push(
        <View key={`s${i}-${k}`} wrap={false} style={{ marginTop: k ? 5 : 0 }}>
          {k === 0 && head}
          {(!!st.title || firstShort) && (
            <View style={[indent, { marginTop: k ? 0 : 5 }]}>
              {!!st.title && <Text style={{ fontWeight: "bold", fontSize: 9.5, color: "#333333" }}>{st.title}</Text>}
              {firstShort && <Bullet text={st.items[0]!} />}
            </View>
          )}
        </View>,
      );
      st.items.forEach((it, m) => { if (!(m === 0 && firstShort)) out.push(<Bullet key={`i${i}-${k}-${m}`} text={it} style={indent} />); });
      const pics = (st.photos ?? []).map((p) => photos.get(p)).filter((b): b is Buffer => !!b);
      if (pics.length) out.push(
        <View key={`p${i}-${k}`} style={[s.row, indent, { flexWrap: "wrap", gap: 6, marginTop: 5 }]}>
          {pics.map((b, n) => <Image key={n} src={b} style={{ width: 128, height: 96, objectFit: "cover", borderWidth: 0.75, borderColor: "#e3ddd0" }} />)}
        </View>,
      );
    });
  });
  out.push(<View key="end" style={{ borderBottomWidth: 0.75, borderBottomColor: LIGHT, marginTop: 8 }} />);
  return out;
}

/** One bullet line. The bullet is part of the text (hanging indent), so it can never be left behind on a page by itself. */
function Bullet({ text, style }: { text: string; style?: Style }) {
  return <Text style={[{ marginTop: 1.5, fontSize: 9.5, color: "#444444", paddingLeft: 10, textIndent: -10 }, style ?? {}]}>{"•\u2002"}{text}</Text>;
}

function EstimatePdf({ d, approved, img }: { d: EstimateDoc; approved?: { name: string; at: string }; img: { logo: Img; meidan: Img; work: Img[]; photos: Map<string, Img> } }) {
  const first = d.customer.name.split(" ")[0];
  return (
    <Document title={`Estimate ${d.number} — ${d.title}`} author={COMPANY.name} subject={`Estimate for ${d.customer.name}`} creator={COMPANY.name} producer={COMPANY.name}>
      <Page size="LETTER" style={s.page}>
        {/* Letterhead */}
        <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: GOLD, paddingBottom: 12 }]}>
          {img.logo ? <Image src={img.logo} style={{ height: 50, width: 150, objectFit: "contain", objectPosition: "left" }} /> : <Text style={[s.serif, { fontSize: 18, fontWeight: "bold" }]}>{COMPANY.name}</Text>}
          <View style={{ alignItems: "flex-end" }}>
            <View style={{ height: 30, justifyContent: "flex-end" }}>
              <Text style={[s.serif, { fontSize: 22, letterSpacing: 4, lineHeight: 1 }]}>ESTIMATE</Text>
            </View>
            <View style={{ marginTop: 6, width: 150, fontSize: 8.5, color: GREY }}>
              {[["No.", String(d.number)], ["Date", d.date], ["Valid until", d.validUntil]].map(([k, v]) => (
                <View key={k} style={s.row}>
                  <Text style={{ width: 52 }}>{k}</Text>
                  <Text style={{ flex: 1, textAlign: "right", color: k === "No." ? INK : GREY, fontWeight: k === "No." ? "bold" : "normal" }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* From / To */}
        <View style={[s.row, { marginTop: 16, gap: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>From</Text>
            <Text style={[s.serif, { fontWeight: "bold", fontSize: 11.5, marginTop: 2 }]}>{COMPANY.name}</Text>
            <Text style={s.muted}>Licensed General Contractor · {COMPANY.license}</Text>
            <Text style={s.muted}>{COMPANY.address}</Text>
            <Text style={s.muted}>{COMPANY.phone} · {COMPANY.email}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Prepared for</Text>
            <Text style={[s.serif, { fontWeight: "bold", fontSize: 11.5, marginTop: 2 }]}>{d.customer.name}</Text>
            {!!d.customer.address && <Text style={s.muted}>{d.customer.address}</Text>}
            {(d.customer.phone || d.customer.email) && <Text style={s.muted}>{[d.customer.phone, d.customer.email].filter(Boolean).join(" · ")}</Text>}
          </View>
        </View>

        {/* Letter */}
        <View style={[s.section, { fontSize: 10.5 }]}>
          <Text style={s.serif}>Dear {first},</Text>
          {d.note.split(/\n{2,}/).map((para, i) => <Text key={i} style={{ marginTop: 5 }}>{para}</Text>)}
          <Text style={{ marginTop: 8 }}>Sincerely,</Text>
          <Text style={[s.serif, { fontWeight: "bold", marginTop: 2 }]}>Meidan D.</Text>
          <Text style={[s.muted, { fontSize: 9 }]}>Owner, {COMPANY.name}</Text>
        </View>

        {/* Scope — each job, step and line is its own block, so a long scope simply continues on the next page */}
        <View style={s.section}>
          <Text style={s.h2} minPresenceAhead={60}>Scope of Work — {d.title}</Text>
          <View style={[s.row, { borderBottomWidth: 0.75, borderBottomColor: "#d8d2c4", paddingVertical: 5, fontSize: 7.5, fontWeight: "bold", color: "#777777", letterSpacing: 1 }]} fixed={false}>
            <Text style={s.no}>NO.</Text>
            <Text style={{ flex: 1 }}>DESCRIPTION</Text>
            <Text style={s.amount}>AMOUNT</Text>
          </View>
          {scopeBlocks(d, img.photos)}
          <View style={[s.row, { justifyContent: "flex-end", paddingTop: 8, gap: 16 }]} wrap={false}>
            <Text style={[s.serif, { fontWeight: "bold", fontSize: 12 }]}>Total Contract Price</Text>
            <Text style={[s.serif, s.amount, { fontWeight: "bold", fontSize: 12 }]}>{money(d.total)}</Text>
          </View>
          {d.exclusions.length > 0 && (
            <Text style={{ marginTop: 10, fontSize: 9.5, color: GREY }}>
              <Text style={{ fontWeight: "bold", color: INK }}>Not included: </Text>{d.exclusions.join("; ")}.
            </Text>
          )}
        </View>

        {/* Payments */}
        <View style={s.section}>
          <Text style={s.h2} minPresenceAhead={60}>Payment Schedule</Text>
          {d.rows.map((r, i) => (
            <View key={i} style={[s.row, { borderBottomWidth: 0.75, borderBottomColor: LIGHT, paddingVertical: 4 }]} wrap={false}>
              <Text style={s.no}>{i + 1}</Text>
              <Text style={{ flex: 1, paddingRight: 10 }}>{r.name}</Text>
              <Text style={s.amount}>{money(r.amount)}</Text>
            </View>
          ))}
          <View style={[s.row, { justifyContent: "flex-end", paddingTop: 4, fontWeight: "bold" }]} wrap={false}>
            <Text>Total</Text>
            <Text style={s.amount}>{money(d.total)}</Text>
          </View>
          <Text style={{ marginTop: 6, fontSize: 8.5, color: "#666666" }}>
            The deposit is $1,000 or 10% of the contract price, whichever is less, as required by California law. Each progress payment is due only after the corresponding work is completed. Payment by check, Zelle, Venmo or card; details are sent with each payment request.
          </Text>
        </View>

        {/* Acceptance */}
        <View style={[s.section, { borderWidth: 1, borderColor: INK, padding: 14 }]} wrap={false}>
          <Text style={[s.serif, { fontWeight: "bold", fontSize: 13 }]}>Acceptance of Estimate</Text>
          <Text style={{ marginTop: 3, fontSize: 9.5, color: GREY }}>
            By approving below, you accept this estimate and ask {COMPANY.name} to prepare the contract. The contract (with your three-day right to cancel) is sent separately for signature. Nothing is charged at this step.
          </Text>
          {approved ? (
            <View style={{ marginTop: 10, borderTopWidth: 0.75, borderTopColor: "#d8d2c4", paddingTop: 6 }}>
              <Text style={[s.serif, { fontSize: 14 }]}>{approved.name}</Text>
              <Text style={{ fontSize: 9.5, color: GREY }}>Approved online on {dateLong(approved.at)}.</Text>
            </View>
          ) : (
            <View style={[s.row, { marginTop: 30, gap: 20, fontSize: 8.5, color: GREY }]}>
              <Text style={{ flex: 2, borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 3 }}>Property owner signature</Text>
              <Text style={{ flex: 1, borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 3 }}>Date</Text>
            </View>
          )}
        </View>

        {/* About us */}
        <View style={[s.section, { borderTopWidth: 0.75, borderTopColor: "#d8d2c4", paddingTop: 18, alignItems: "center" }]} wrap={false}>
          {img.meidan && <Image src={img.meidan} style={{ width: 80, height: 80, borderRadius: 40 }} />}
          <Text style={[s.label, { marginTop: 8 }]}>About us</Text>
          <Text style={[s.serif, { fontWeight: "bold", fontSize: 14, marginTop: 2 }]}>Meidan D.</Text>
          <Text style={[s.muted, { fontSize: 9.5, marginTop: 3 }]}>Project Manager</Text>
          <Text style={{ marginTop: 6, fontSize: 10, textAlign: "center", maxWidth: 400 }}>
            {COMPANY.name} is a licensed general contractor ({COMPANY.license}) serving San Diego County. I personally oversee every project, and our own crew handles the work from start to finish — plans and permits, construction, finishes and the final inspection. You will always have one person to call: me.
          </Text>
          <Text style={{ marginTop: 6, fontSize: 8, color: "#666666", textAlign: "center", maxWidth: 420 }}>{TRADES.join(" | ")}</Text>
        </View>
        <View style={{ marginTop: 12 }} wrap={false}>
          <Text style={[s.label, { textAlign: "center" }]}>Our work</Text>
          <View style={[s.row, { flexWrap: "wrap", justifyContent: "space-between", marginTop: 6, rowGap: 8 }]}>
            {RECENT_WORK.map((w, i) => img.work[i] && (
              <View key={w.src} style={{ width: "32%" }}>
                <Image src={img.work[i]!} style={{ width: "100%", height: 84, objectFit: "cover" }} />
                <Text style={{ fontSize: 7.5, color: "#777777", marginTop: 2 }}>{w.caption}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>{COMPANY.name} · {COMPANY.license} · {COMPANY.phone} · {COMPANY.web}</Text>
          {/* "Page X of Y" is stamped afterwards (numberPages): react-pdf's own page counter crashes on long documents. */}
        </View>
      </Page>
    </Document>
  );
}

/** The finished PDF file for this estimate. Photos come from private storage; a missing one is left out, never breaks the file. */
export async function estimatePdf(e: Estimate): Promise<Buffer> {
  const ids = [...new Set(e.jobs.flatMap((j) => j.steps.flatMap((st) => st.photos ?? [])))];
  const [logo, meidan, work, photos] = await Promise.all([
    read("logo-light.png"),
    read("brand/meidan-round.png"),
    Promise.all(RECENT_WORK.map((w) => read(w.src.slice(1)))),
    Promise.all(ids.map(async (id) => [id, await photo(id)] as const)).then((xs) => new Map(xs)),
  ]);
  const approved = e.status === "Approved" && e.approvedName && e.approvedAt ? { name: e.approvedName, at: e.approvedAt } : undefined;
  return numberPages(await renderToBuffer(<EstimatePdf d={estimateDoc(e)} approved={approved} img={{ logo, meidan, work, photos }} />), e.number);
}

/** "Estimate #612 · Page 3 of 9" at the bottom right of every page, on the footer line. */
async function numberPages(file: Buffer, number: number): Promise<Buffer> {
  const pdf = await PDFDocument.load(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  pages.forEach((page, i) => {
    const text = `Estimate #${number} · Page ${i + 1} of ${pages.length}`;
    page.drawText(text, { x: page.getWidth() - 46 - font.widthOfTextAtSize(text, 7.5), y: 27, size: 7.5, font, color: rgb(0.47, 0.47, 0.47) });
  });
  return Buffer.from(await pdf.save());
}

/** "Estimate-612-Smith.pdf" */
export const pdfName = (e: Estimate) => `Estimate-${e.number}-${e.customer.name.split(" ").at(-1)?.replace(/[^A-Za-z0-9-]/g, "") || "MD-Golden-Builders"}.pdf`;
