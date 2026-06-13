"use client";
import { signIn, useSession } from "next-auth/react";
import { FaGithub } from "react-icons/fa";
import { FaXTwitter, FaTwitter } from "react-icons/fa6";
import { redirect } from "next/navigation";
import Link from "next/link"; // [NY]

export default function Home() {
    const { data: session } = useSession();

    if (session) {
        return redirect("/app");
    }

    return (
        <div className="min-h-screen bg-black flex items-center">
            {/* Left side */}
            <div className="flex-1 flex flex-col justify-center px-16 max-w-xl gap-10">
                <div className="flex md:hidden justify-start mb-2">
                    <FaXTwitter className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-white font-extrabold text-6xl leading-tight tracking-tight hover:text-sky-400 transition-colors duration-300">
                    Happening now.
                </h1>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <p className="text-white text-xl font-bold mb-2">Join today.</p>

                    <button
                        onClick={() => signIn("github")}
                        className="flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-full py-2 px-6 hover:bg-sky-400 transition-colors duration-200 w-full"
                    >
                        <FaGithub className="w-5 h-5" />
                        Sign in with GitHub
                    </button>

                    <div className="flex items-center gap-2 my-1">
                        <div className="flex-1 h-px bg-gray-700" />
                        <span className="text-gray-500 text-sm">or</span>
                        <div className="flex-1 h-px bg-gray-700" />
                    </div>

                    {/* [NY] Link til registrering med e-post */}
                    <Link
                        href="/register"
                        className="flex items-center justify-center bg-sky-500 text-white font-semibold rounded-full py-2 px-6 hover:bg-sky-400 transition-colors duration-200 w-full text-center"
                    >
                        Create account
                    </Link>

                    <p className="text-gray-500 text-xs mt-2">
                        By signing up, you agree to the{" "}
                        <button className="text-blue-400 hover:underline cursor-pointer">Terms of Service</button>{" "}
                        and{" "}
                        <button className="text-blue-400 hover:underline cursor-pointer">Privacy Policy</button>.
                    </p>

                    <div className="mt-6">
                        <p className="text-white font-bold mb-3">Already have an account?</p>
                        {/* [ENDRET] Peker nå til /login i stedet for GitHub signIn */}
                        <Link
                            href="/login"
                            className="block w-full border border-gray-600 text-white font-semibold rounded-full py-3 px-6 hover:bg-sky-400 transition-colors duration-200 text-center"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right side – X/Twitter logo with hover easter egg */}
            <div className="hidden md:flex flex-1 items-center justify-center relative group">
                <FaXTwitter className="text-white absolute transition-opacity duration-300 opacity-100 group-hover:opacity-0" size={200} />
                <FaTwitter className="text-sky-400 absolute transition-opacity duration-300 opacity-0 group-hover:opacity-100" size={200} />
            </div>
        </div>
    );
}
