"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useParams, useRouter, redirect } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiMoreHorizontal, FiImage, FiX } from "react-icons/fi";
import { PostCard, timeAgo, type Post, type Comment, mapPostsInCache } from "@/components/Post";

// [ENDRET] CommentItem: kun klikk på avatar/navn navigerer til profil (ikke hele kortet)
function CommentItem({ comment, postId, currentUserId }: { comment: Comment; postId: string; currentUserId: string | undefined }) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const menuRef = useRef<HTMLDivElement>(null);
    const isOwner = currentUserId === comment.author.id;

    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showMenu]);

    const deleteComment = useMutation({
        mutationFn: () => api.deleteComment(comment.id),
        onSuccess: () => {
            queryClient.setQueryData<Comment[]>(["comments", postId], (old) => old?.filter((c) => c.id !== comment.id));
            queryClient.setQueriesData(
                { predicate: (q) => ["posts", "post", "userPosts"].includes(q.queryKey[0] as string) },
                (old) => mapPostsInCache(old, (p: Post) =>
                    p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
                )
            );
        },
    });

    const editComment = useMutation({
        mutationFn: () => api.editComment(comment.id, editContent),
        onSuccess: (updated: { id: string; content: string }) => {
            queryClient.setQueryData<Comment[]>(["comments", postId], (old) =>
                old?.map((c) => c.id === comment.id ? { ...c, content: updated.content } : c)
            );
            setIsEditing(false);
        },
    });

    return (
        // [ENDRET] Bug: article er ikke lenger klikkbar — kun avatar/navn navigerer
        <article className="flex gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900/30 transition">
            {/* Avatar — klikk navigerer til profil */}
            <div
                className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-0.5 cursor-pointer"
                onClick={() => router.push(`/app/profile/${comment.author.id}`)}
            >
                {comment.author.image ? <img src={comment.author.image} alt="avatar" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                        {/* Navn — klikk navigerer til profil */}
                        <span
                            className="font-bold text-white text-sm hover:underline cursor-pointer"
                            onClick={() => router.push(`/app/profile/${comment.author.id}`)}
                        >
                            {comment.author.name ?? "Unknown"}
                        </span>
                        <span className="text-zinc-500 text-sm truncate">
                            @{comment.author.email?.toLowerCase().replace(/\s+/g, "") ?? "unknown"}
                        </span>
                        <span className="text-zinc-500 text-sm">·</span>
                        <span className="text-zinc-500 text-sm flex-shrink-0">{timeAgo(comment.createdAt)}</span>
                    </div>
                    {isOwner && (
                        <div className="relative flex-shrink-0" ref={menuRef}>
                            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full hover:bg-zinc-700 transition text-zinc-500 hover:text-white">
                                <FiMoreHorizontal className="w-4 h-4" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-7 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg overflow-hidden z-20 min-w-[140px]">
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition text-white">Edit</button>
                                    <button onClick={() => { deleteComment.mutate(); setShowMenu(false); }} disabled={deleteComment.isPending} className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition text-red-400 disabled:opacity-40">
                                        {deleteComment.isPending ? "Deleting..." : "Delete"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {isEditing ? (
                    <div className="mt-1">
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={280} rows={2}
                            className="w-full bg-zinc-800 text-white text-sm p-2 rounded-lg resize-none outline-none leading-relaxed" />
                        <div className="flex gap-2 mt-1">
                            <button onClick={() => editComment.mutate()} disabled={editComment.isPending || !editContent.trim()}
                                className="text-xs font-bold bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white px-3 py-1 rounded-full transition">
                                {editComment.isPending ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                                className="text-xs font-bold border border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-3 py-1 rounded-full transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-white text-sm mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
                )}
            </div>
        </article>
    );
}

export default function PostDetail() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const postId = params.postId as string;
    const [content, setContent] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const MAX = 280;

    const post = useQuery<Post>({ queryKey: ["post", postId], queryFn: () => api.getPost(postId) });
    const comments = useQuery<Comment[]>({ queryKey: ["comments", postId], queryFn: () => api.getComments(postId), enabled: !!post.data });
    // [ENDRET] Bug: bruker currentUser for oppdatert profilbilde i compose-boksen
    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });

    const createComment = useMutation({
        mutationFn: () => api.createComment(postId, content),
        onSuccess: (newComment: Comment) => {
            queryClient.setQueryData<Comment[]>(["comments", postId], (old) => [...(old ?? []), newComment]);
            queryClient.setQueryData<Post>(["post", postId], (old) =>
                old ? { ...old, commentCount: old.commentCount + 1 } : old
            );
            queryClient.setQueriesData(
                { predicate: (q) => q.queryKey[0] === "posts" },
                (old) => mapPostsInCache(old, (p: Post) =>
                    p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
                )
            );
            setContent("");
        },
    });

    if (post.isError) return redirect("/app");

    const remaining = MAX - content.length;
    const canReply = content.trim().length > 0 && remaining >= 0;

    return (
        <div className="min-h-screen text-white w-full">
            <div className="flex items-center gap-6 px-4 py-3 sticky top-0 bg-black/80 backdrop-blur z-10 border-b border-zinc-800">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition">
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <p className="font-bold text-xl">Post</p>
            </div>

            {post.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {post.isSuccess && (
                <>
                    <div className="px-4 py-3 border-b border-zinc-800">
                        <PostCard post={post.data} disableClick />
                    </div>

                    {/* Reply compose */}
                    <div className="flex gap-3 px-4 py-3 border-b border-zinc-800">
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
                                rows={1}
                                className="w-full bg-transparent text-white text-base placeholder-zinc-500 resize-none outline-none leading-relaxed"
                            />
                            <div className="flex items-center justify-end mt-2 pt-2 gap-3">
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

                    {comments.isLoading && (
                        <div className="flex justify-center py-8">
                            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {comments.isSuccess && comments.data.length === 0 && (
                        <div className="px-4 py-12 text-center">
                            <p className="text-zinc-400 font-bold text-lg mb-1">No replies yet</p>
                            <p className="text-zinc-500 text-sm">Be the first to reply.</p>
                        </div>
                    )}

                    {comments.isSuccess && comments.data.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} postId={postId} currentUserId={currentUser.data?.id} />
                    ))}
                </>
            )}
        </div>
    );
}
