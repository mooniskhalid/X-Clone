"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FiX, FiImage } from "react-icons/fi";
import { type Post } from "@/components/Post";

// [NY] Konverterer File til base64 data-URL
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function CreatePostModal({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const currentUser = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });
    const [content, setContent] = useState("");
    // [NY] Valgfritt bilde i post
    const [image, setImage] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const MAX = 280;

    useEffect(() => { textareaRef.current?.focus(); }, []);

    // [ENDRET] Escape lukker modalen, Ctrl+Enter poster
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && !e.shiftKey && content.trim().length > 0) { e.preventDefault(); createPost.mutate(); }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose, content]);

    const createPost = useMutation({
        mutationFn: () => api.createPost(content, image),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
            queryClient.invalidateQueries({ queryKey: ["userPosts"] });
            setContent("");
            setImage(null);
            onClose();
        },
    });

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setImage(base64);
        e.target.value = "";
    }

    const remaining = MAX - content.length;
    const canPost = content.trim().length > 0 && remaining >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-8 sm:pt-16" onClick={onClose}>
            <div className="w-full max-w-xl bg-black border border-zinc-800 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center px-4 py-2">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition text-white" aria-label="Close">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 pb-4 flex gap-3">
                    {/* [ENDRET] Avatar fra currentUser (ikke session) — viser oppdatert profilbilde */}
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
                            placeholder="What is happening?!"
                            rows={3}
                            className="w-full bg-transparent text-white text-lg placeholder-zinc-500 resize-none outline-none leading-relaxed"
                        />

                        {/* [NY] Bildeforhåndsvisning */}
                        {image && (
                            <div className="relative mt-2 rounded-2xl overflow-hidden border border-zinc-700">
                                <img src={image} alt="preview" className="w-full object-cover max-h-[300px]" />
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black transition"
                                >
                                    <FiX className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-800">
                            {/* [NY] Bildeopplastingsknapp */}
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="text-sky-500 hover:bg-sky-500/10 p-2 rounded-full transition"
                                type="button"
                            >
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
                                    className="bg-white text-black font-bold px-5 py-1.5 rounded-full text-sm hover:bg-sky-400 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {createPost.isPending ? "Posting..." : "Post"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
