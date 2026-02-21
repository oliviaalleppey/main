import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FBFBF9] font-sans p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <h1 className="text-3xl font-serif text-gray-900 tracking-wide mb-2">Olivia Admin</h1>
                <p className="text-gray-500 mb-8">Access the hotel management dashboard</p>

                <form action={async () => {
                    "use server"
                    // Redirects back to the admin dashboard upon successful Google Auth
                    await signIn("google", { redirectTo: "/admin" })
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
                    Secure access restricted to authorized personnel.
                </p>
            </div>
        </div>
    )
}
