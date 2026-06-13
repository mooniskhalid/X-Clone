"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiRepeat, FiHeart, FiShare, FiMoreHorizontal, FiX } from "react-icons/fi";
import { FaHeart, FaRetweet } from "react-icons/fa";
import { ReplyModal } from "@/components/ReplyModal";
import { QuoteModal } from "@/components/QuoteModal";

export type QuotedPost = {
    id: string;
    content: string;
    image?: string | null;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
};

export type Post = {
    id: string;
    content: string;
    image?: string | null;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
    likeCount: number;
    repostCount: number;
    commentCount: number;
    isLiked: boolean;
    isReposted: boolean;
    quotedPost?: QuotedPost | null;
    repostedBy?: { id: string; name: string | null; email: string | null } | null;
};

export type Comment = {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
};

export function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function invalidateAllPostQueries(queryClient: any) {
    ["posts", "post", "userPosts", "likedPosts", "mediaPosts"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
    );
}

// Oppdaterer en post i alle cache-former (infinite, liste, enkelt objekt)
function updatePostInCache(queryClient: any, postId: string, updater: (p: Post) => Post) {
    const keys = ["posts", "userPosts", "likedPosts", "mediaPosts"];
    keys.forEach((key) => {
        queryClient.setQueriesData({ queryKey: [key] }, (old: any) => {
            if (!old) return old;
            if (old.pages) return { ...old, pages: old.pages.map((page: any) => ({ ...page, posts: page.posts.map((p: Post) => p.id === postId ? updater(p) : p) })) };
            if (old.posts) return { ...old, posts: old.posts.map((p: Post) => p.id === postId ? updater(p) : p) };
            if (Array.isArray(old)) return old.map((p: Post) => p.id === postId ? updater(p) : p);
            return old;
        });
    });
    // Enkelt post-view
    queryClient.setQueryData(["post", postId], (old: any) => old?.id === postId ? updater(old) : old);
}

// [ENDRET] disableClick-prop: når true, skrus navigasjon av (brukes på post-detaljsiden)
export function PostCard({ post, disableClick }: { post: Post; disableClick?: boolean }) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showRepostMenu, setShowRepostMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const repostMenuRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const menuRef = useRef<HTMLDivElement>(null);

    const [copied, setCopied] = useState(false);
    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });
    const isOwner = currentUser.isSuccess && currentUser.data.id === post.author.id;

    function handleShare() {
        const url = `${window.location.origin}/app/post/${post.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    // Lukk menyer ved klikk utenfor
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showMenu]);

    useEffect(() => {
        if (!showRepostMenu) return;
        const handler = (e: MouseEvent) => {
            if (repostMenuRef.current && !repostMenuRef.current.contains(e.target as Node)) setShowRepostMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showRepostMenu]);

    // Like — optimistisk: instant UI, sync ved suksess
    const likePost = useMutation({
        mutationFn: () => api.likePost(post.id),
        onMutate: () => {
            updatePostInCache(queryClient, post.id, (p) => ({
                ...p,
                isLiked: !p.isLiked,
                likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1,
            }));
        },
        onError: () => invalidateAllPostQueries(queryClient), // rollback ved feil
        onSuccess: () => invalidateAllPostQueries(queryClient), // sync med server
    });

    // Repost — optimistisk: instant UI, sync ved suksess
    const repostPost = useMutation({
        mutationFn: () => api.repost(post.id),
        onMutate: () => {
            updatePostInCache(queryClient, post.id, (p) => ({
                ...p,
                isReposted: !p.isReposted,
                repostCount: p.isReposted ? p.repostCount - 1 : p.repostCount + 1,
            }));
        },
        onError: () => invalidateAllPostQueries(queryClient),
        onSuccess: () => invalidateAllPostQueries(queryClient),
    });

    // [ENDRET] Slett post
    const deletePost = useMutation({
        mutationFn: () => api.deletePost(post.id),
        onSuccess: () => invalidateAllPostQueries(queryClient),
    });

    // [ENDRET] Rediger post
    const editPost = useMutation({
        mutationFn: () => api.editPost(post.id, editContent),
        onSuccess: () => {
            invalidateAllPostQueries(queryClient);
            setIsEditing(false);
        },
    });

    return (
        <>
        <article
            className={`flex flex-col border-b border-zinc-800 transition ${disableClick ? "" : "hover:bg-zinc-900/50 cursor-pointer"}`}
            onClick={disableClick ? undefined : () => router.push(`/app/post/${post.id}`)}
        >
            {/* Repost-label */}
            {post.repostedBy && (
                <div className="flex items-center gap-1.5 px-4 pt-2 text-zinc-500 text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/app/profile/${post.repostedBy!.id}`); }}>
                    <FaRetweet className="w-3.5 h-3.5" />
                    <span className="hover:underline cursor-pointer font-medium">{post.repostedBy.name ?? "Someone"} reposted</span>
                </div>
            )}
            <div className="flex gap-3 px-4 py-3">
            {/* Avatar */}
            <div
                className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-0.5 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); router.push(`/app/profile/${post.author.id}`); }}
            >
                {post.author.image ? <img src={post.author.image} alt="avatar" className="w-full h-full object-cover" /> : null}
            </div>

            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                        <span
                            className="font-bold text-white hover:underline text-sm cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); router.push(`/app/profile/${post.author.id}`); }}
                        >
                            {post.author.name ?? "Unknown"}
                        </span>
                        <span className="text-zinc-500 text-sm">·</span>
                        <span className="text-zinc-500 text-sm flex-shrink-0">{timeAgo(post.createdAt)}</span>
                    </div>

                    {isOwner && (
                        <div className="relative flex-shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full hover:bg-zinc-700 transition text-zinc-500 hover:text-white">
                                <FiMoreHorizontal className="w-4 h-4" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-7 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition text-white">Edit</button>
                                    <button onClick={() => { deletePost.mutate(); setShowMenu(false); }} disabled={deletePost.isPending} className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition text-red-400 disabled:opacity-40">
                                        {deletePost.isPending ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Innhold / editor */}
                {isEditing ? (
                    <div onClick={(e) => e.stopPropagation()} className="mt-1">
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={280} rows={3}
                            className="w-full bg-zinc-800 text-white text-sm p-2 rounded-lg resize-none outline-none leading-relaxed" />
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => editPost.mutate()} disabled={editPost.isPending || !editContent.trim()}
                                className="text-xs font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white px-3 py-1 rounded-full transition">
                                {editPost.isPending ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                                className="text-xs font-bold border border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-3 py-1 rounded-full transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-white text-sm mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
                )}

                {/* Bilde i post */}
                {post.image && !isEditing && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                        <img src={post.image} alt="Post image" className="w-full object-cover max-h-[400px]" />
                    </div>
                )}

                {/* Sitert post (quote repost) */}
                {post.quotedPost && !isEditing && (
                    <div
                        className="mt-2 border border-zinc-700 rounded-2xl px-3 py-2 hover:bg-zinc-800/50 transition cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-full bg-zinc-600 overflow-hidden flex-shrink-0">
                                {post.quotedPost.author.image && <img src={post.quotedPost.author.image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <span className="font-bold text-white text-xs">{post.quotedPost.author.name ?? "Unknown"}</span>
                        </div>
                        <p className="text-white text-sm leading-relaxed line-clamp-3">{post.quotedPost.content}</p>
                        {post.quotedPost.image && (
                            <img src={post.quotedPost.image} alt="" className="mt-1.5 w-full rounded-xl object-cover max-h-[150px]" />
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 text-zinc-500 max-w-xs -ml-1.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowReplyModal(true)} className="flex items-center gap-1 group hover:text-sky-400 transition text-sm">
                        <span className="p-1.5 rounded-full group-hover:bg-sky-400/10 transition"><FiMessageCircle className="w-[18px] h-[18px]" /></span>
                        {post.commentCount > 0 && <span>{post.commentCount}</span>}
                    </button>

                    {/* Repost dropdown: vanlig repost eller quote */}
                    <div className="relative" ref={repostMenuRef}>
                        <button
                            onClick={() => setShowRepostMenu(!showRepostMenu)}
                            className={`flex items-center gap-1 group transition text-sm ${post.isReposted ? "text-green-400" : "hover:text-green-400"}`}
                        >
                            <span className="p-1.5 rounded-full group-hover:bg-green-400/10 transition">
                                {post.isReposted ? <FaRetweet className="w-[18px] h-[18px]" /> : <FiRepeat className="w-[18px] h-[18px]" />}
                            </span>
                            {post.repostCount > 0 && <span>{post.repostCount}</span>}
                        </button>
                        {showRepostMenu && (
                            <div className="absolute bottom-8 left-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                                <button
                                    onClick={() => { repostPost.mutate(); setShowRepostMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition text-white flex items-center gap-2"
                                >
                                    <FiRepeat className="w-4 h-4" />
                                    {post.isReposted ? "Undo repost" : "Repost"}
                                </button>
                                <button
                                    onClick={() => { setShowQuoteModal(true); setShowRepostMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition text-white flex items-center gap-2"
                                >
                                    <FiMessageCircle className="w-4 h-4" />
                                    Quote
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={() => likePost.mutate()} className={`flex items-center gap-1 group transition text-sm ${post.isLiked ? "text-pink-500" : "hover:text-pink-500"}`}>
                        <span className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition">
                            {post.isLiked ? <FaHeart className="w-[18px] h-[18px]" /> : <FiHeart className="w-[18px] h-[18px]" />}
                        </span>
                        {post.likeCount > 0 && <span>{post.likeCount}</span>}
                    </button>

                    <button onClick={handleShare} className={`flex items-center gap-1 group transition text-sm ${copied ? "text-green-400" : "hover:text-sky-400"}`}>
                        <span className="p-1.5 rounded-full group-hover:bg-sky-400/10 transition">
                            <FiShare className="w-[18px] h-[18px]" />
                        </span>
                        {copied && <span className="text-xs">Copied!</span>}
                    </button>
                </div>
            </div>
            </div>
        </article>

        {showReplyModal && <ReplyModal post={post} onClose={() => setShowReplyModal(false)} />}
        {showQuoteModal && <QuoteModal post={post} onClose={() => setShowQuoteModal(false)} />}
        </>
    );
}

