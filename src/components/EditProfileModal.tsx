"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useEffect, useRef, useState } from "react";
import { FiX, FiCamera } from "react-icons/fi";

type UserData = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    banner: string | null;
    showEmail: boolean; // [NY]
};

// [NY] Konverterer en File til base64 data-URL for lagring i SQLite
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// [NY] Modal for å redigere profil: navn, bio, e-post, profilbilde (avatar) og banner
// Bilder lastes opp via FileReader og lagres som base64-strenger i databasen
export function EditProfileModal({
    user,
    onClose,
}: {
    user: UserData;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();

    const [name, setName] = useState(user.name ?? "");
    const [bio, setBio] = useState(user.bio ?? "");
    const [email, setEmail] = useState(user.email ?? "");
    const [showEmail, setShowEmail] = useState(user.showEmail); // [NY]
    const [image, setImage] = useState<string | null>(user.image);
    const [banner, setBanner] = useState<string | null>(user.banner ?? null);
    const [error, setError] = useState<string | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // [ENDRET] Escape lukker modalen
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const updateProfile = useMutation({
        mutationFn: () => api.updateProfile({
            name,
            bio,
            email,
            showEmail, // [NY]
            image: image ?? undefined,
            banner: banner ?? undefined,
        }),
        onSuccess: (updated) => {
            // Oppdater alle relaterte cacher
            queryClient.setQueryData(["user", updated.id], (old: any) =>
                old ? { ...old, ...updated } : old
            );
            queryClient.setQueryData(["currentUser"], (old: any) =>
                old ? { ...old, ...updated } : old
            );
            queryClient.setQueryData(["user"], (old: any) =>
                old ? { ...old, ...updated } : old
            );
            onClose();
        },
        onError: (err: any) => {
            setError(err?.response?.data?.error ?? "Something went wrong");
        },
    });

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setImage(base64);
    }

    async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const base64 = await fileToBase64(file);
        setBanner(base64);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-8 sm:pt-12 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl bg-black border border-zinc-800 rounded-2xl overflow-hidden mb-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition text-white"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                        <p className="font-bold text-lg text-white">Edit profile</p>
                    </div>
                    <button
                        onClick={() => updateProfile.mutate()}
                        disabled={updateProfile.isPending}
                        className="bg-white text-black font-bold px-5 py-1.5 rounded-full text-sm hover:bg-zinc-200 disabled:opacity-50 transition"
                    >
                        {updateProfile.isPending ? "Saving..." : "Save"}
                    </button>
                </div>

                {/* Banner */}
                <div
                    className="relative w-full h-36 bg-zinc-700 cursor-pointer group"
                    onClick={() => bannerInputRef.current?.click()}
                >
                    {banner ? (
                        <img src={banner} alt="banner" className="w-full h-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition gap-3">
                        <FiCamera className="w-6 h-6 text-white" />
                    </div>
                    <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBannerChange}
                    />
                </div>

                {/* Avatar */}
                <div className="px-4 -mt-12 mb-3 relative z-10">
                    <div
                        className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-zinc-600 cursor-pointer group relative"
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        {image ? (
                            <img src={image} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-600" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition">
                            <FiCamera className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>

                {/* Form fields */}
                <div className="px-4 pb-6 flex flex-col gap-4">
                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-sm">Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            className="bg-transparent border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-sky-500 transition"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-sm">Bio</span>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={160}
                            rows={3}
                            className="bg-transparent border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-sky-500 transition resize-none"
                        />
                        <span className="text-zinc-600 text-xs text-right">{bio.length}/160</span>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-sm">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-transparent border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-sky-500 transition"
                        />
                    </label>

                    {/* [NY] Toggle: vis e-post på profilen */}
                    <div className="flex items-center justify-between py-1">
                        <div>
                            <p className="text-white text-sm font-medium">Show email on profile</p>
                            <p className="text-zinc-500 text-xs">Other users can see your email address</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowEmail(v => !v)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${showEmail ? "bg-sky-500" : "bg-zinc-700"}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${showEmail ? "translate-x-5" : "translate-x-0"}`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
