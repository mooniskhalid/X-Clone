"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";

export default function FollowPage() {
    const queryClient = useQueryClient();

    const users = useQuery({
        queryKey: ["whoToFollow", "all"],
        queryFn: () => api.getWhoToFollow(),
    });

    const followUser = useMutation({
        mutationFn: (userId: string) => api.followUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["whoToFollow"] });
        },
    });

    return (
        <div className="min-h-screen text-white w-full">
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
                <p className="font-bold text-xl flex-shrink-0">Follow</p>
                <SearchBar />
            </div>

            {users.isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {users.isSuccess && users.data.length === 0 && (
                <div className="px-4 py-16 text-center">
                    <p className="text-zinc-400 font-bold text-xl mb-1">You follow everyone!</p>
                    <p className="text-zinc-500 text-sm">There are no more users to follow.</p>
                </div>
            )}

            <div className="divide-y divide-zinc-800">
                {users.data?.map((user: any) => (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-900/50 transition">
                        <Link href={`/app/profile/${user.id}`} className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-zinc-700 overflow-hidden">
                                {user.image
                                    ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full bg-zinc-600" />}
                            </div>
                        </Link>

                        <Link href={`/app/profile/${user.id}`} className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{user.name ?? "Unknown"}</p>
                            {user.followerCount > 0 && (
                                <p className="text-zinc-500 text-xs mt-0.5">
                                    {user.followerCount.toLocaleString()} followers
                                </p>
                            )}
                        </Link>

                        <button
                            onClick={() => followUser.mutate(user.id)}
                            disabled={followUser.isPending && followUser.variables === user.id}
                            className="bg-white text-black font-bold px-4 py-1.5 rounded-full text-sm hover:bg-sky-400 transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
                        >
                            Follow
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
