import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
            <p className="text-7xl font-black">404</p>
            <p className="text-zinc-400 text-xl font-bold">This page doesn't exist</p>
            <p className="text-zinc-500 text-sm">The page you're looking for isn't here.</p>
            <Link href="/app" className="mt-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-zinc-200 transition">
                Go home
            </Link>
        </div>
    );
}
