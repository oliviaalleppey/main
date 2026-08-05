import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/seo";
import { DEFAULT_PALETTE } from "@/lib/config/palette";

/**
 * Generated social card, inherited by every route that does not define its own.
 *
 * This replaces the old `/og-image.jpg` reference, which pointed at a file that
 * never existed — so every share preview on the site was blank.
 */
export const alt = `${BRAND} — Luxury 5-Star Hotel in Alappuzha, Kerala`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
    const { brandPrimaryDeep, brandPrimary, goldAccent, surfaceCream } = DEFAULT_PALETTE;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${brandPrimaryDeep} 0%, ${brandPrimary} 100%)`,
                    color: surfaceCream,
                    fontFamily: "serif",
                    position: "relative",
                }}
            >
                {/* Gold hairline frame */}
                <div
                    style={{
                        position: "absolute",
                        top: 36,
                        left: 36,
                        right: 36,
                        bottom: 36,
                        border: `2px solid ${goldAccent}`,
                        opacity: 0.55,
                        display: "flex",
                    }}
                />

                <div
                    style={{
                        fontSize: 26,
                        letterSpacing: 14,
                        textTransform: "uppercase",
                        color: goldAccent,
                        marginBottom: 28,
                    }}
                >
                    Alappuzha · Kerala
                </div>

                <div
                    style={{
                        fontSize: 104,
                        fontWeight: 700,
                        letterSpacing: -1,
                        lineHeight: 1.05,
                        textAlign: "center",
                        padding: "0 80px",
                    }}
                >
                    {BRAND}
                </div>

                <div
                    style={{
                        width: 120,
                        height: 2,
                        background: goldAccent,
                        margin: "36px 0",
                        display: "flex",
                    }}
                />

                <div
                    style={{
                        fontSize: 32,
                        letterSpacing: 3,
                        opacity: 0.9,
                        textAlign: "center",
                        padding: "0 100px",
                    }}
                >
                    A 5-Star Backwater Retreat at Finishing Point
                </div>
            </div>
        ),
        size
    );
}
