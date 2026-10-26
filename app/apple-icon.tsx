import { appIconResponse } from "@/app/_components/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone-startschermicoon (iOS maakt een transparante achtergrond zwart). */
export default function AppleIcon() {
  return appIconResponse(size.width);
}
