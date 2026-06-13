"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error ?? "Something went wrong.");
            setLoading(false);
            return;
        }

        // Auto-login etter registrering
        const loginRes = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!loginRes.ok) {
            setError("Account created, but login failed. Try signing in.");
            setLoading(false);
            return;
        }

        window.location.href = "/app";
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="w-full max-w-sm flex flex-col gap-6">
                <FaXTwitter className="w-10 h-10 text-white mx-auto" />
                <h1 className="text-white text-3xl font-bold text-center">Create your account</h1>

                <button
                    onClick={() => signIn("github")}
                    className="flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-full py-2 px-6 hover:bg-sky-400 transition-colors duration-200 w-full"
                >
                    <FaGithub className="w-5 h-5" />
                    Sign up with GitHub
                </button>

                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-700" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-gray-700" />
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="bg-black border border-gray-600 text-white rounded-md px-4 py-3 focus:outline-none focus:border-sky-500"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="bg-black border border-gray-600 text-white rounded-md px-4 py-3 focus:outline-none focus:border-sky-500"
                    />
                    <input
                        type="password"
                        placeholder="Password (min. 6 characters)"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="bg-black border border-gray-600 text-white rounded-md px-4 py-3 focus:outline-none focus:border-sky-500"
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-white text-black font-bold rounded-full py-3 hover:bg-sky-400 transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="text-gray-500 text-sm text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-sky-400 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
