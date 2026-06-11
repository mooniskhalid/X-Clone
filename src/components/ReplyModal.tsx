"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { type Post, type Comment, timeAgo, mapPostsInCache } from "@/components/Post";

export function ReplyModal({ post, onClose }: { post: Post; onClose: () => void }) {
    const queryClient = useQueryClient();
    // [ENDRET] Bug: bruker currentUser fra cache istedenfor session for oppdatert profilbilde
    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });
    const [content, setContent] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const MAX = 280;

    useEffect(() => { textareaRef.current?.focus(); }, []);

    // [ENDRET] Escape lukker modalen
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const createComment = useMutation({
        mutationFn: () => api.createComment(post.id, content),
        onSuccess: (newComment: Comment) => {
            queryClient.setQueryData<Comment[]>(["comments", post.id], (old) => [...(old ?? []), newComment]);
            // Oppdater commentCount i alle post-cacher
            queryClient.setQueriesData(
                { predicate: (q) => ["posts", "post", "userPosts"].includes(q.queryKey[0] as string) },
                (old) => mapPostsInCache(old, (p: Post) =>
                    p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p
                )
            );
            setContent("");
            onClose();
        },
    });

    const remaining = MAX - content.length;
    const canReply = content.trim().length > 0 && remaining >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-8 sm:pt-16" onClick={onClose}>
            <div className="w-full max-w-xl bg-black border border-zinc-800 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center px-4 py-2">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition text-white" aria-label="Close">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Original post */}
                <div className="px-4 pb-2 flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                            {post.author.image ? <img src={post.author.image} alt="avatar" className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="w-0.5 flex-1 bg-zinc-800 mt-2" />
                    </div>
                    <div className="flex-1 min-w-0 pb-3">
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-bold text-white text-sm">{post.author.name ?? "Unknown"}</span>
                            <span className="text-zinc-500 text-sm truncate">@{post.author.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}</span>
                            <span className="text-zinc-500 text-sm">·</span>
                            <span className="text-zinc-500 text-sm flex-shrink-0">{timeAgo(post.createdAt)}</span>
                        </div>
                        <p className="text-white text-sm mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
                        <p className="text-zinc-500 text-sm mt-3">
                            Replying to <span className="text-sky-500">@{post.author.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}</span>
                        </p>
                    </div>
                </div>

                {/* Reply compose */}
                <div className="px-4 pb-4 flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-0.5">
                        {currentUser.data?.image
                            ? <img src={currentUser.data.image} alt="avatar" className="w-full h-full object-cover" />
                            : null}
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
                            placeholder="Post your reply"
                            rows={2}
                            className="w-full bg-transparent text-white text-lg placeholder-zinc-500 resize-none outline-none leading-relaxed"
                        />
                        <div className="flex items-center justify-end mt-2 pt-3 border-t border-zinc-800 gap-3">
                            {content.length > 0 && (
                                <span className={`text-sm font-medium ${remaining <= 0 ? "text-red-500" : remaining <= 20 ? "text-yellow-400" : "text-zinc-500"}`}>
                                    {remaining}
                                </span>
                            )}
                            <button
                                onClick={() => createComment.mutate()}
                                disabled={!canReply || createComment.isPending}
                                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-1.5 rounded-full text-sm transition"
                            >
                                {createComment.isPending ? "Replying..." : "Reply"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
