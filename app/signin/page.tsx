import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import { isGuestDestination, safeCallbackPath } from "@/lib/auth/callback"

// Sign-in: never index, never follow.
export const metadata: Metadata = {
    title: "Sign In",
    robots: { index: false, follow: false, nocache: true },
}

/**
 * One sign-in page for guests (My Bookings) and staff (the admin panel).
 *
 * It returns people to where they were going — see safeCallbackPath for why
 * that matters and what it refuses — and speaks to guests as guests: a guest
 * told "restricted to authorized personnel" assumes they are in the wrong place.
 */
export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string | string[] }>
}) {
    const { callbackUrl } = await searchParams
    const destination = safeCallbackPath(callbackUrl, "/admin")
    const forGuest = isGuestDestination(destination)

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--surface-cream)] font-sans p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-2">
                    {forGuest ? "Your Bookings" : "Olivia Admin"}
                </h1>
                <p className="text-gray-500 mb-8">
                    {forGuest
                        ? "Sign in with the Google account for the email you booked with."
                        : "Access the hotel management dashboard"}
                </p>

                <form action={async () => {
                    "use server"
                    await signIn("google", { redirectTo: destination })
                }}>
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-[#1A3B2E] hover:bg-[#122b21] text-white h-12 text-lg"
                    >
                        Sign in with Google
                    </Button>
                </form>

                <p className="mt-6 text-sm text-gray-400">
                    {forGuest
                        ? "We only show bookings made with your account's email address."
                        : "Secure access restricted to authorized personnel."}
                </p>
            </div>
        </div>
    )
}
