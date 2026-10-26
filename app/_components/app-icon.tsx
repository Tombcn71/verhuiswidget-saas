import { ImageResponse } from "next/og";

const robot = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M9 13v2"/><path d="M15 13v2"/></svg>`;

/**
 * App-icoon voor het startscherm: wit robotje op merkblauw. Het robotje beslaat
 * 60% zodat het ook binnen de "maskable" veilige zone van Android valt.
 */
export function appIconResponse(size: number) {
  const inner = Math.round(size * 0.6);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a73e8",
        }}
      >
        <img
          width={inner}
          height={inner}
          alt=""
          src={`data:image/svg+xml;utf8,${encodeURIComponent(robot)}`}
        />
      </div>
    ),
    { width: size, height: size },
  );
}
