"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";

export function SearchBar({ placeholder = "Search" }: { placeholder?: string }) {
    const [query, setQuery] = useState("");
    const router = useRouter();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;
        router.push(`/app/explore?q=${encodeURIComponent(q)}`);
    }

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 focus-within:border-sky-500 transition">
                <FiSearch className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="bg-transparent text-white text-sm placeholder-zinc-500 outline-none w-full"
                />
            </div>
        </form>
    );
}
