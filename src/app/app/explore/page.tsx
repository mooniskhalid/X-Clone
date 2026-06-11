"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiSearch, FiX } from "react-icons/fi";
import { PostCard, type Post } from "@/components/Post";
import Link from "next/link";

export default function ExplorePage() {
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") ?? "");
    const [activeTab, setActiveTab] = useState<"posts" | "people">("posts");

    // Sync når URL-param endres (f.eks. fra SearchBar på andre sider)
    useEffect(() => {
        const q = searchParams.get("q") ?? "";
        setQuery(q);
        setDebouncedQuery(q);
    }, [searchParams]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    const results = useQuery({
        queryKey: ["search", debouncedQuery],
        queryFn: () => api.search(debouncedQuery),
        enabled: debouncedQuery.length > 0,
        staleTime: 30_000,
    });

    const hasPosts = (results.data?.posts?.length ?? 0) > 0;
    const hasUsers = (results.data?.users?.length ?? 0) > 0;

    return (
        <div className="min-h-screen text-white w-full">
            <div className="sticky top-0 bg-black/90 backdrop-blur z-10 px-4 py-3 border-b border-zinc-800">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search posts and people"
                        className="w-full bg-zinc-900 text-white placeholder-zinc-500 rounded-full py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-1 focus:ring-sky-500 transition"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition">
                            <FiX className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {debouncedQuery && (
                    <div className="flex mt-2 -mx-4">
                        <button
                            onClick={() => setActiveTab("posts")}
                            className={`flex-1 py-2.5 text-sm font-semibold relative transition ${activeTab === "posts" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            Posts
                            {activeTab === "posts" && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-sky-500 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("people")}
                            className={`flex-1 py-2.5 text-sm font-semibold relative transition ${activeTab === "people" ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        >
                            People
                            {activeTab === "people" && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-sky-500 rounded-full" />}
                        </button>
                    </div>
                )}
            </div>

            {!debouncedQuery && (
                <div className="px-4 py-16 text-center">
                    <FiSearch className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 font-bold text-lg">Search X-clone</p>
                    <p className="text-zinc-500 text-sm mt-1">Find posts and people.</p>
                </div>
            )}

            {results.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {results.isSuccess && !hasPosts && !hasUsers && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-lg">No results for "{debouncedQuery}"</p>
                    <p className="text-zinc-500 text-sm mt-1">Try different keywords.</p>
                </div>
            )}

            {results.isSuccess && activeTab === "posts" && hasPosts &&
                results.data!.posts.map((post: Post) => <PostCard key={post.id} post={post} />)
            }

            {results.isSuccess && activeTab === "people" && hasUsers && results.data!.users.map((user: any) => (
                <Link
                    key={user.id}
                    href={`/app/profile/${user.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                        {user.image ? <img src={user.image} alt="avatar" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm">{user.name ?? "Unknown"}</p>
                        <p className="text-zinc-500 text-sm truncate">@{user.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
