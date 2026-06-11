"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useQuery as useSessionQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { PostCard, type Post } from "@/components/Post";
import { FiImage, FiX } from "react-icons/fi";
import { SearchBar } from "@/components/SearchBar";

// [NY] Konverterer File til base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function App() {
    const queryClient = useQueryClient();
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    // [ENDRET] activeTab styrer hvilken feed som vises
    const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const MAX = 280;

    // [ENDRET] Avatar fra currentUser-cache istedenfor session
    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });

    // [ENDRET] useInfiniteQuery for cursor-basert paginering
    const postsQuery = useInfiniteQuery({
        queryKey: ["posts", activeTab],
        queryFn: ({ pageParam }) =>
            api.getPosts(activeTab === "following" ? "following" : undefined, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

    const allPosts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];

    const createPost = useMutation({
        mutationFn: () => api.createPost(content, image),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["userPosts"] });
            setContent("");
            setImage(null);
        },
    });

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImage(await fileToBase64(file));
        e.target.value = "";
    }

    const remaining = MAX - content.length;
    const canPost = content.trim().length > 0 && remaining >= 0;

    return (
        <div className="min-h-screen text-white w-full">
            {/* Header med tabs */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-800">
                <div className="flex items-center gap-3 px-4 py-3">
                    <p className="font-bold text-xl flex-shrink-0">Home</p>
                    <SearchBar placeholder="Search" />
                </div>
                <div className="flex">
                    <button
                        onClick={() => setActiveTab("forYou")}
                        className={`flex-1 py-3 text-sm font-semibold relative transition ${activeTab === "forYou" ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"}`}
                    >
                        For you
                        {activeTab === "forYou" && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-500 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("following")}
                        className={`flex-1 py-3 text-sm font-semibold relative transition ${activeTab === "following" ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"}`}
                    >
                        Following
                        {activeTab === "following" && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-500 rounded-full" />}
                    </button>
                </div>
            </div>

            {/* Compose-boks */}
            <div className="flex gap-3 px-4 py-3 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden mt-1">
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
                        placeholder="What is happening?!"
                        rows={2}
                        className="w-full bg-transparent text-white text-xl placeholder-zinc-500 resize-none outline-none leading-relaxed"
                    />

                    {/* [NY] Bildeforhåndsvisning */}
                    {image && (
                        <div className="relative mt-2 rounded-2xl overflow-hidden border border-zinc-700">
                            <img src={image} alt="preview" className="w-full object-cover max-h-[300px]" />
                            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black transition">
                                <FiX className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800">
                        {/* [NY] Bildeopplastingsknapp */}
                        <button onClick={() => imageInputRef.current?.click()} className="text-white hover:text-sky-400 p-2 rounded-full transition" type="button">
                            <FiImage className="w-5 h-5" />
                        </button>
                        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                        <div className="flex items-center gap-3">
                            {content.length > 0 && (
                                <span className={`text-sm font-medium ${remaining <= 0 ? "text-red-500" : remaining <= 20 ? "text-yellow-400" : "text-zinc-500"}`}>
                                    {remaining}
                                </span>
                            )}
                            <button
                                onClick={() => createPost.mutate()}
                                disabled={!canPost || createPost.isPending}
                                className="bg-white text-black font-bold hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-1.5 rounded-full text-sm transition"
                            >
                                {createPost.isPending ? "Posting..." : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feed */}
            {postsQuery.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {postsQuery.isSuccess && allPosts.length === 0 && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-xl mb-1">Welcome!</p>
                    <p className="text-zinc-500 text-sm">
                        {activeTab === "following" ? "Follow someone to see their posts here." : "Be the first to post something."}
                    </p>
                </div>
            )}

            {allPosts.map((post) => <PostCard key={post.id} post={post} />)}

            {/* [NY] Last mer-knapp */}
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
