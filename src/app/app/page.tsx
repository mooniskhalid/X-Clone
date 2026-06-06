"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiMessageCircle, FiRepeat, FiHeart, FiShare } from "react-icons/fi";
import { FaHeart, FaRetweet } from "react-icons/fa";

type Post = {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    likeCount: number;
    repostCount: number;
    isLiked: boolean;
    isReposted: boolean;
};

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PostCard({ post }: { post: Post }) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const likePost = useMutation({
        mutationFn: () => api.likePost(post.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["posts"] });
            const prev = queryClient.getQueryData<Post[]>(["posts"]);
            queryClient.setQueryData<Post[]>(["posts"], (old) =>
                old?.map((p) =>
                    p.id === post.id
                        ? {
                              ...p,
                              isLiked: !p.isLiked,
                              likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
                          }
                        : p
                )
            );
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            queryClient.setQueryData(["posts"], ctx?.prev);
        },
    });

    return (
        <article
            className="flex gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900/50 transition cursor-pointer"
            onClick={() => router.push(`/app/profile/${post.author.id}`)}
        >
            {/* Avatar */}
            <div
                className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-0.5"
                onClick={(e) => { e.stopPropagation(); router.push(`/app/profile/${post.author.id}`); }}
            >
                {post.author.image ? (
                    <img src={post.author.image} alt="avatar" className="w-full h-full object-cover" />
                ) : null}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-1 flex-wrap">
                    <span
                        className="font-bold text-white hover:underline text-sm"
                        onClick={(e) => { e.stopPropagation(); router.push(`/app/profile/${post.author.id}`); }}
                    >
                        {post.author.name ?? "Unknown"}
                    </span>
                    <span className="text-zinc-500 text-sm truncate">
                        @{post.author.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}
                    </span>
                    <span className="text-zinc-500 text-sm">·</span>
                    <span className="text-zinc-500 text-sm flex-shrink-0">{timeAgo(post.createdAt)}</span>
                </div>

                {/* Text */}
                <p className="text-white text-sm mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>

                {/* Actions */}
                <div
                    className="flex items-center justify-between mt-3 text-zinc-500 max-w-xs -ml-1.5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Reply */}
                    <button className="flex items-center gap-1 group hover:text-sky-400 transition text-sm">
                        <span className="p-1.5 rounded-full group-hover:bg-sky-400/10 transition">
                            <FiMessageCircle className="w-[18px] h-[18px]" />
                        </span>
                    </button>

                    {/* Repost */}
                    <button
                        className={`flex items-center gap-1 group transition text-sm ${
                            post.isReposted ? "text-green-400" : "hover:text-green-400"
                        }`}
                    >
                        <span className="p-1.5 rounded-full group-hover:bg-green-400/10 transition">
                            {post.isReposted ? (
                                <FaRetweet className="w-[18px] h-[18px]" />
                            ) : (
                                <FiRepeat className="w-[18px] h-[18px]" />
                            )}
                        </span>
                        {post.repostCount > 0 && <span>{post.repostCount}</span>}
                    </button>

                    {/* Like */}
                    <button
                        onClick={() => likePost.mutate()}
                        className={`flex items-center gap-1 group transition text-sm ${
                            post.isLiked ? "text-pink-500" : "hover:text-pink-500"
                        }`}
                    >
                        <span className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition">
                            {post.isLiked ? (
                                <FaHeart className="w-[18px] h-[18px]" />
                            ) : (
                                <FiHeart className="w-[18px] h-[18px]" />
                            )}
                        </span>
                        {post.likeCount > 0 && <span>{post.likeCount}</span>}
                    </button>

                    {/* Share */}
                    <button className="flex items-center gap-1 group hover:text-sky-400 transition text-sm">
                        <span className="p-1.5 rounded-full group-hover:bg-sky-400/10 transition">
                            <FiShare className="w-[18px] h-[18px]" />
                        </span>
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function App() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const [content, setContent] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const MAX = 280;

    const posts = useQuery<Post[]>({
        queryKey: ["posts"],
        queryFn: api.getPosts,
    });

    const createPost = useMutation({
        mutationFn: () => api.createPost(content),
        onSuccess: (newPost) => {
            queryClient.setQueryData<Post[]>(["posts"], (old) => [newPost, ...(old ?? [])]);
            setContent("");
        },
    });

    const remaining = MAX - content.length;
    const canPost = content.trim().length > 0 && remaining >= 0;

    return (
        <div className="min-h-screen text-white w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-800">
                <div className="px-4 py-3">
                    <p className="font-bold text-xl">Home</p>
                </div>
                <div className="flex">
                    <button className="flex-1 py-3 text-sm font-semibold text-white relative">
                        For you
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-500 rounded-full" />
                    </button>
                    <button className="flex-1 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition">
                        Following
                    </button>
                </div>
            </div>

            {/* Compose box */}
            <div className="flex gap-3 px-4 py-3 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-1">
                    {session?.user?.image ? (
                        <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                    ) : null}
                </div>
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                        }}
                        placeholder="What is happening?!"
                        rows={2}
                        className="w-full bg-transparent text-white text-xl placeholder-zinc-500 resize-none outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-end mt-2 pt-3 border-t border-zinc-800 gap-3">
                        {content.length > 0 && (
                            <span
                                className={`text-sm font-medium ${
                                    remaining <= 0
                                        ? "text-red-500"
                                        : remaining <= 20
                                        ? "text-yellow-400"
                                        : "text-zinc-500"
                                }`}
                            >
                                {remaining}
                            </span>
                        )}
                        <button
                            onClick={() => createPost.mutate()}
                            disabled={!canPost || createPost.isPending}
                            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-1.5 rounded-full text-sm transition"
                        >
                            {createPost.isPending ? "Posting..." : "Post"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Feed */}
            {posts.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {posts.isSuccess && posts.data.length === 0 && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-xl mb-1">Welcome!</p>
                    <p className="text-zinc-500 text-sm">Be the first to post something.</p>
                </div>
            )}

            {posts.isSuccess && posts.data.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
