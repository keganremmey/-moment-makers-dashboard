"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { flyerUrl, propertySlug } from "@/lib/intro";

// Makes one tracked flyer URL and QR code per apartment property.
export default function LinkBuilder() {
  const [property, setProperty] = useState("");
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(false);

  const slug = propertySlug(property);
  const url = slug ? flyerUrl(property) : "";

  useEffect(() => {
    let cancelled = false;
    const render = url
      ? QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#1c1b18", light: "#ffffff" } })
      : Promise.resolve("");
    render.then((out) => {
      if (!cancelled) setSvg(out);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 1200, color: { dark: "#1c1b18", light: "#ffffff" } });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  function downloadSvg() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    a.download = `qr-${slug}.svg`;
    a.click();
  }

  return (
    <div className="rounded-md border border-ttw-line bg-white/60 p-5">
      <label htmlFor="property" className="block font-semibold">
        Apartment property name
      </label>
      <input
        id="property"
        value={property}
        onChange={(e) => setProperty(e.target.value)}
        placeholder="e.g. The Bowie"
        autoComplete="off"
        className="mt-2 w-full rounded-md border border-ttw-line bg-ttw-cream px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-ttw-copper"
      />

      {url ? (
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_200px]">
          <div className="min-w-0">
            <p className="font-ttw-mono text-xs uppercase tracking-[0.12em] text-ttw-muted">
              utm_content = {slug}
            </p>
            <p className="mt-2 break-all rounded bg-ttw-cream-2 p-3 font-ttw-mono text-sm">{url}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="rounded-md bg-ttw-charcoal px-4 py-2 text-sm font-semibold text-ttw-cream">
                {copied ? "Copied" : "Copy link"}
              </button>
              <button type="button" onClick={downloadPng} className="rounded-md border border-ttw-charcoal px-4 py-2 text-sm font-semibold">
                Download QR (PNG)
              </button>
              <button type="button" onClick={downloadSvg} className="rounded-md border border-ttw-charcoal px-4 py-2 text-sm font-semibold">
                Download QR (SVG, for print)
              </button>
            </div>
          </div>
          <div
            className="w-full max-w-[200px] [&>svg]:h-auto [&>svg]:w-full"
            role="img"
            aria-label={`QR code for ${url}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      ) : null}
    </div>
  );
}
