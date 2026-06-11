"use client";

// [NY] Varselside — viser like, følge og svar-varsler
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/components/Post";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

const typeLabel: Record<string, string> = {
    LIKE: "liked your post",
    FOLLOW: "started following you",
    REPLY: "replied to your post",
};

const typeEmoji: Record<string, string> = {
    LIKE: "❤️",
    FOLLOW: "👤",
    REPLY: "💬",
};

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: api.getNotifications,
    });

    const markRead = useMutation({
        mutationFn: api.markNotificationsRead,
        onSuccess: () => {
            // Nullstill unread-teller i begge cacher
            queryClient.setQueryData(["notifications"], (old: any) =>
                old ? { ...old, unreadCount: 0 } : old
            );
            queryClient.setQueryData(["notificationsCount"], (old: any) =>
                old ? { ...old, unreadCount: 0 } : old
            );
        },
    });

    // Marker alt som lest når siden åpnes
    useEffect(() => {
        if (data && data.unreadCount > 0) {
            markRead.mutate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.unreadCount]);

    return (
        <div className="min-h-screen text-white w-full">
            <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-zinc-800 px-4 py-3 z-10 flex items-center gap-3">
                <p className="font-bold text-xl flex-shrink-0">Notifications</p>
                <SearchBar />
            </div>

            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!isLoading && data?.notifications.length === 0 && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-xl mb-1">No notifications yet</p>
                    <p className="text-zinc-500 text-sm">When someone likes, follows, or replies, it shows up here.</p>
                </div>
            )}

            {data?.notifications.map((n: any) => (
                <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900/50 transition ${!n.read ? "bg-sky-500/5" : ""}`}
                >
                    {/* Actor avatar */}
                    <Link href={`/app/profile/${n.actor.id}`} className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                            {n.actor.image
                                ? <img src={n.actor.image} alt="avatar" className="w-full h-full object-cover" />
                                : null}
                        </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                            <span className="text-lg leading-none mt-0.5">{typeEmoji[n.type] ?? "🔔"}</span>
                            <div>
                                <p className="text-sm text-white">
                                    <Link href={`/app/profile/${n.actor.id}`} className="font-bold hover:underline">
                                        {n.actor.name ?? "Someone"}
                                    </Link>{" "}
                                    <span className="text-zinc-300">{typeLabel[n.type] ?? "interacted with you"}</span>
                                </p>

                                {/* Vis post-snippet for LIKE og REPLY */}
                                {n.post && (
                                    <Link href={`/app/post/${n.post.id}`} className="block mt-1 text-zinc-500 text-sm hover:text-zinc-300 transition line-clamp-2">
                                        "{n.post.content.length > 80 ? n.post.content.slice(0, 80) + "…" : n.post.content}"
                                    </Link>
                                )}

                                <p className="text-zinc-500 text-xs mt-0.5">{timeAgo(n.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
