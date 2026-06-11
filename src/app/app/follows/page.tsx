"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { PostCard, type Post } from "@/components/Post";
import { SearchBar } from "@/components/SearchBar";

export default function FollowsPage() {
    const postsQuery = useInfiniteQuery({
        queryKey: ["posts", "following"],
        queryFn: ({ pageParam }) => api.getPosts("following", pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const allPosts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];

    return (
        <div className="min-h-screen text-white w-full">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
                <p className="font-bold text-xl flex-shrink-0">Following</p>
                <SearchBar />
            </div>

            {postsQuery.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {postsQuery.isSuccess && allPosts.length === 0 && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-xl mb-1">Nothing here yet</p>
                    <p className="text-zinc-500 text-sm">Follow someone to see their posts here.</p>
                </div>
            )}

            {allPosts.map((post: Post) => <PostCard key={post.id} post={post} />)}

            {postsQuery.hasNextPage && (
                <div className="flex justify-center py-6">
                    <button
                        onClick={() => postsQuery.fetchNextPage()}
                        disabled={postsQuery.isFetchingNextPage}
                        className="text-sky-500 hover:text-sky-400 font-semibold text-sm disabled:opacity-50 transition"
                    >
                        {postsQuery.isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                </div>
            )}
        </div>
    );
}
