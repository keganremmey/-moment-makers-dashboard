import { ImageResponse } from "next/og";

// A minimal belt-strip glyph — the same wrap-strip-and-knot motif as
// components/BeltChip.tsx, reduced to something legible at favicon scale:
// a brass strip on ink, with a darker fold notch standing in for the knot.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16120c",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 22,
            height: 8,
            background: "#c9a15c",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 4,
              height: "100%",
              margin: "0 auto",
              background: "#16120c",
              opacity: 0.35,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
