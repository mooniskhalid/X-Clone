"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { type Post, timeAgo } from "@/components/Post";

export function QuoteModal({ post, onClose }: { post: Post; onClose: () => void }) {
    const queryClient = useQueryClient();
    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });
    const [content, setContent] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const MAX = 280;

    useEffect(() => { textareaRef.current?.focus(); }, []);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && !e.shiftKey && content.trim().length > 0) { e.preventDefault(); quotePost.mutate(); }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose, content]);

    const quotePost = useMutation({
        mutationFn: () => api.quotePost(post.id, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["userPosts"] });
            onClose();
        },
    });

    const remaining = MAX - content.length;
    const canPost = content.trim().length > 0 && remaining >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-8 sm:pt-16" onClick={onClose}>
            <div className="w-full max-w-xl bg-black border border-zinc-800 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center px-4 py-2">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition text-white">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Compose */}
                <div className="px-4 pb-3 flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-0.5">
                        {currentUser.data?.image && <img src={currentUser.data.image} alt="avatar" className="w-full h-full object-cover" />}
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
                            placeholder="Add a comment..."
                            rows={2}
                            className="w-full bg-transparent text-white text-lg placeholder-zinc-500 resize-none outline-none leading-relaxed"
                        />

                        {/* Sitert post preview */}
                        <div className="border border-zinc-700 rounded-2xl px-3 py-2 mt-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full bg-zinc-600 overflow-hidden flex-shrink-0">
                                    {post.author.image && <img src={post.author.image} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <span className="font-bold text-white text-xs">{post.author.name ?? "Unknown"}</span>
                                <span className="text-zinc-500 text-xs">· {timeAgo(post.createdAt)}</span>
                            </div>
                            <p className="text-white text-sm leading-relaxed line-clamp-3">{post.content}</p>
                            {post.image && <img src={post.image} alt="" className="mt-1.5 w-full rounded-xl object-cover max-h-[120px]" />}
                        </div>

                        <div className="flex items-center justify-end mt-2 pt-3 border-t border-zinc-800 gap-3">
                            {content.length > 0 && (
                                <span className={`text-sm font-medium ${remaining <= 0 ? "text-red-500" : remaining <= 20 ? "text-yellow-400" : "text-zinc-500"}`}>
                                    {remaining}
                                </span>
                            )}
                            <button
                                onClick={() => quotePost.mutate()}
                                disabled={!canPost || quotePost.isPending}
                                className="bg-white text-black font-bold px-5 py-1.5 rounded-full text-sm hover:bg-sky-400 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {quotePost.isPending ? "Posting..." : "Quote"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
