"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

type SimpleUser = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
};

export default function FollowersPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const followers = useQuery<SimpleUser[]>({
        queryKey: ["followers", userId],
        queryFn: () => api.getFollowers(userId),
    });

    return (
        <div className="min-h-screen text-white w-full">
            <div className="flex items-center gap-6 px-4 py-3 sticky top-0 bg-black/80 backdrop-blur z-10 border-b border-zinc-800">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-zinc-800 transition">
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <p className="font-bold text-xl">Followers</p>
            </div>

            {followers.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {followers.isSuccess && followers.data.length === 0 && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-xl mb-1">No followers yet</p>
                    <p className="text-zinc-500 text-sm">When someone follows this account, they'll show up here.</p>
                </div>
            )}

            {followers.isSuccess && followers.data.map((user) => (
                <Link
                    key={user.id}
                    href={`/app/profile/${user.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                >
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                        {user.image ? (
                            <img src={user.image} alt="avatar" className="w-full h-full object-cover" />
                        ) : null}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm">{user.name ?? "Unknown"}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}
