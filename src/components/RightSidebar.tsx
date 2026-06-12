"use client";

// [NY] Høyre sidebar: "Who to Follow" og "Trending"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import Link from "next/link";

export function RightSidebar() {
    const queryClient = useQueryClient();

    const whoToFollow = useQuery({
        queryKey: ["whoToFollow"],
        queryFn: () => api.getWhoToFollow(3),
        staleTime: 5 * 60 * 1000,
    });

    const trending = useQuery({
        queryKey: ["trending"],
        queryFn: api.getTrending,
        staleTime: 5 * 60 * 1000,
    });

    const followUser = useMutation({
        mutationFn: (userId: string) => api.followUser(userId),
        onSuccess: (_data, userId) => {
            // Fjern brukeren fra "who to follow"-listen etter følging
            queryClient.setQueryData(["whoToFollow"], (old: any[]) =>
                old?.filter((u) => u.id !== userId)
            );
        },
    });

    return (
        <div className="flex flex-col gap-4 pt-3">
            {/* Who to Follow */}
            <div className="rounded-2xl bg-zinc-900 overflow-hidden">
                <h2 className="font-bold text-xl px-4 pt-4 pb-1 text-white">Who to follow</h2>

                {whoToFollow.isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {whoToFollow.isSuccess && whoToFollow.data.length === 0 && (
                    <p className="px-4 py-3 text-zinc-500 text-sm">You're following everyone! 🎉</p>
                )}

                {whoToFollow.isSuccess && whoToFollow.data.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition">
                        <Link href={`/app/profile/${user.id}`} className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                                {user.image
                                    ? <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                                    : null}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-white truncate">{user.name ?? "Unknown"}</p>
                                <p className="text-zinc-500 text-sm truncate">
                                    @{user.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={() => followUser.mutate(user.id)}
                            disabled={followUser.isPending}
                            className="ml-3 flex-shrink-0 bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full hover:bg-zinc-200 disabled:opacity-50 transition"
                        >
                            Follow
                        </button>
                    </div>
                ))}

                <Link href="/app/explore" className="block px-4 py-3 text-sky-500 text-sm hover:bg-zinc-800 transition">
                    Show more
                </Link>
            </div>

            {/* Trending */}
            <div className="rounded-2xl bg-zinc-900 overflow-hidden">
                <h2 className="font-bold text-xl px-4 pt-4 pb-1 text-white">Trending</h2>

                {trending.isLoading && (
                    <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {trending.isSuccess && trending.data.length === 0 && (
                    <p className="px-4 py-3 text-zinc-500 text-sm">Nothing trending yet — be the first to post!</p>
                )}

                {trending.isSuccess && trending.data.map((post: any, i: number) => (
                    <Link
                        key={post.id}
                        href={`/app/post/${post.id}`}
                        className="block px-4 py-3 hover:bg-zinc-800 transition border-t border-zinc-800"
                    >
                        <p className="text-zinc-500 text-xs mb-0.5">#{i + 1} · Trending</p>
                        <p className="font-bold text-sm text-white leading-snug line-clamp-2">
                            {post.content.length > 80 ? post.content.slice(0, 80) + "…" : post.content}
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                            {post.likeCount + post.commentCount} interactions
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
