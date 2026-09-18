import { ImageResponse } from "next/og";

import {
  SITE_DESCRIPTION,
  SITE_TITLE,
  SOCIAL_IMAGE_ALT,
} from "@/lib/seo/constants";

export const alt = SOCIAL_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "stretch",
        background: "#EEE1C6",
        color: "#00471B",
        display: "flex",
        fontFamily: "Arial, sans-serif",
        height: "100%",
        width: "100%",
      }}
    >
      <div style={{ background: "#0077C0", display: "flex", width: 72 }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
        }}
      >
        <div
          style={{
            color: "#0077C0",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 8,
            marginBottom: 32,
            textTransform: "uppercase",
          }}
        >
          tullyelly.com
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -5,
            lineHeight: 1,
          }}
        >
          {SITE_TITLE}
        </div>
        <div
          style={{
            background: "#00471B",
            display: "flex",
            height: 10,
            margin: "38px 0 30px",
            width: 180,
          }}
        />
        <div
          style={{
            color: "#00471B",
            display: "flex",
            fontSize: 34,
            lineHeight: 1.35,
            maxWidth: 850,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    </div>,
    size,
  );
}
