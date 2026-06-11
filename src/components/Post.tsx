"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiRepeat, FiHeart, FiShare, FiMoreHorizontal, FiImage, FiX } from "react-icons/fi";
import { FaHeart, FaRetweet } from "react-icons/fa";
import { ReplyModal } from "@/components/ReplyModal";

export type Post = {
    id: string;
    content: string;
    // [NY] Valgfritt bilde lagret som base64-streng
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

// [NY] Hjelpefunksjon: oppdaterer poster i alle cache-former (infinite, paginert, enkelt)
function mapPostsInCache(old: any, updater: (p: Post) => Post): any {
    if (!old) return old;
    if (old.pages) // infinite query: { pages: [{posts, nextCursor}] }
        return { ...old, pages: old.pages.map((page: any) => ({ ...page, posts: page.posts.map(updater) })) };
    if (old.posts) // paginert query: { posts, nextCursor }
        return { ...old, posts: old.posts.map(updater) };
    if (Array.isArray(old)) return old.map(updater);
    if (typeof old === "object" && old.id) return updater(old as Post);
    return old;
}

// [NY] Hjelpefunksjon: fjerner en post fra alle cache-former
function filterPostFromCache(old: any, postId: string): any {
    if (!old) return old;
    if (old.pages)
        return { ...old, pages: old.pages.map((page: any) => ({ ...page, posts: page.posts.filter((p: Post) => p.id !== postId) })) };
    if (old.posts)
        return { ...old, posts: old.posts.filter((p: Post) => p.id !== postId) };
    if (Array.isArray(old)) return old.filter((p: Post) => p.id !== postId);
    return old;
}

// [NY] Deler cache-predikater for gjenbruk
const postCachePredicate = (q: any) =>
    ["posts", "post", "userPosts"].includes(q.queryKey[0] as string);

// [ENDRET] disableClick-prop: når true, skrus navigasjon av (brukes på post-detaljsiden)
export function PostCard({ post, disableClick }: { post: Post; disableClick?: boolean }) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });
    const isOwner = currentUser.isSuccess && currentUser.data.id === post.author.id;

    // Lukk meny ved klikk utenfor
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showMenu]);

    // Like — optimistisk oppdatering
    const likePost = useMutation({
        mutationFn: () => api.likePost(post.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ predicate: postCachePredicate });
            const prev = queryClient.getQueriesData({ predicate: postCachePredicate });
            const toggle = (p: Post): Post =>
                p.id === post.id ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 } : p;
            queryClient.setQueriesData({ predicate: postCachePredicate }, (old) => mapPostsInCache(old, toggle));
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
    });

    // [NY] Repost — optimistisk oppdatering
    const repostPost = useMutation({
        mutationFn: () => api.repost(post.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ predicate: postCachePredicate });
            const prev = queryClient.getQueriesData({ predicate: postCachePredicate });
            const toggle = (p: Post): Post =>
                p.id === post.id ? { ...p, isReposted: !p.isReposted, repostCount: p.isReposted ? p.repostCount - 1 : p.repostCount + 1 } : p;
            queryClient.setQueriesData({ predicate: postCachePredicate }, (old) => mapPostsInCache(old, toggle));
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            ctx?.prev?.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
    });

    // Slett post
    const deletePost = useMutation({
        mutationFn: () => api.deletePost(post.id),
        onSuccess: () => {
            queryClient.setQueriesData({ predicate: postCachePredicate }, (old) => filterPostFromCache(old, post.id));
            queryClient.removeQueries({ queryKey: ["post", post.id] });
        },
    });

    // Rediger post
    const editPost = useMutation({
        mutationFn: () => api.editPost(post.id, editContent),
        onSuccess: (updated: { id: string; content: string }) => {
            const updateContent = (p: Post): Post => p.id === post.id ? { ...p, content: updated.content } : p;
            queryClient.setQueriesData({ predicate: postCachePredicate }, (old) => mapPostsInCache(old, updateContent));
            setIsEditing(false);
        },
    });

    return (
        <>
        <article
            className={`flex gap-3 px-4 py-3 border-b border-zinc-800 transition ${disableClick ? "" : "hover:bg-zinc-900/50 cursor-pointer"}`}
            onClick={disableClick ? undefined : () => router.push(`/app/post/${post.id}`)}
        >
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
                        <span className="text-zinc-500 text-sm truncate">
                            @{post.author.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}
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

                {/* [NY] Bilde i post */}
                {post.image && !isEditing && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                        <img src={post.image} alt="Post image" className="w-full object-cover max-h-[400px]" />
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 text-zinc-500 max-w-xs -ml-1.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowReplyModal(true)} className="flex items-center gap-1 group hover:text-sky-400 transition text-sm">
                        <span className="p-1.5 rounded-full group-hover:bg-sky-400/10 transition"><FiMessageCircle className="w-[18px] h-[18px]" /></span>
                        {post.commentCount > 0 && <span>{post.commentCount}</span>}
                    </button>

                    {/* [ENDRET] Repost — nå funksjonell med optimistisk oppdatering */}
                    <button onClick={() => repostPost.mutate()} className={`flex items-center gap-1 group transition text-sm ${post.isReposted ? "text-green-400" : "hover:text-green-400"}`}>
                        <span className="p-1.5 rounded-full group-hover:bg-green-400/10 transition">
                            {post.isReposted ? <FaRetweet className="w-[18px] h-[18px]" /> : <FiRepeat className="w-[18px] h-[18px]" />}
                        </span>
                        {post.repostCount > 0 && <span>{post.repostCount}</span>}
                    </button>

                    <button onClick={() => likePost.mutate()} className={`flex items-center gap-1 group transition text-sm ${post.isLiked ? "text-pink-500" : "hover:text-pink-500"}`}>
                        <span className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition">
                            {post.isLiked ? <FaHeart className="w-[18px] h-[18px]" /> : <FiHeart className="w-[18px] h-[18px]" />}
                        </span>
                        {post.likeCount > 0 && <span>{post.likeCount}</span>}
                    </button>

                    <button className="flex items-center gap-1 group hover:text-sky-400 transition text-sm">
                        <span className="p-1.5 rounded-full group-hover:bg-sky-400/10 transition"><FiShare className="w-[18px] h-[18px]" /></span>
                    </button>
                </div>
            </div>
        </article>

        {showReplyModal && <ReplyModal post={post} onClose={() => setShowReplyModal(false)} />}
        </>
    );
}

// Eksporter hjelpefunksjonene for bruk i andre komponenter
export { mapPostsInCache, filterPostFromCache, postCachePredicate };
