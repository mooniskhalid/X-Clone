"use client";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useSession } from "next-auth/react";
import { PostCard, type Post } from "@/components/Post";
import Link from "next/link";
import { EditProfileModal } from "@/components/EditProfileModal";
import { FaXTwitter } from "react-icons/fa6";

const TABS = ["Posts", "Likes", "Media", "Highlights", "Articles"] as const;
type Tab = typeof TABS[number];

function PremiumGate({ feature }: { feature: string }) {
    return (
        <div className="flex flex-col items-center px-6 py-16 text-center gap-4">
            <FaXTwitter className="w-10 h-10 fill-white" />
            <p className="font-black text-2xl">{feature} on X</p>
            <p className="text-zinc-400 text-sm max-w-xs">
                You must be subscribed to Premium to {feature === "Highlight posts" ? "highlight posts on your profile" : "write Articles on X"}.
            </p>
            <Link
                href="/app/premium"
                className="mt-1 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-sky-400 transition-colors duration-200 text-sm"
            >
                Subscribe to Premium
            </Link>
        </div>
    );
}

export default function Profile() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("Posts");
    const [showEditModal, setShowEditModal] = useState(false);
    const queryClient = useQueryClient();
    const userId = params.userId as string;

    const user = useQuery({
        queryKey: ["user", userId],
        queryFn: () => api.getUser(userId),
    });

    const postsQuery = useInfiniteQuery({
        queryKey: ["userPosts", userId],
        queryFn: ({ pageParam }) => api.getUserPosts(userId, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: activeTab === "Posts",
    });

    const likesQuery = useQuery({
        queryKey: ["likedPosts", userId],
        queryFn: () => api.getLikedPosts(userId),
        enabled: activeTab === "Likes",
    });

    const mediaQuery = useQuery({
        queryKey: ["mediaPosts", userId],
        queryFn: () => api.getMediaPosts(userId),
        enabled: activeTab === "Media",
    });

    const allPosts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];

    const followUser = useMutation({
        mutationFn: () => api.followUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user", userId] });
            queryClient.invalidateQueries({ queryKey: ["whoToFollow"] });
        },
    });

    if (user.isError) return redirect("/app");

    const joinedDate = user.data?.createdAt
        ? new Date(user.data.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : null;

    return (
        <div className="min-h-screen text-white w-full">
            {/* Header */}
            <div className="flex items-center gap-6 px-4 py-3 sticky top-0 bg-black/80 backdrop-blur z-10">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-zinc-800 transition">
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <p className="font-bold text-lg leading-tight">{user.data?.name ?? "Profile"}</p>
                    <p className="text-sm text-zinc-500">{allPosts.length} posts</p>
                </div>
            </div>

            {/* Banner */}
            <div className="w-full h-48 bg-zinc-700 relative overflow-hidden">
                {user.data?.banner ? <img src={user.data.banner} alt="banner" className="w-full h-full object-cover" /> : null}
            </div>

            {/* Avatar + knapp */}
            <div className="flex justify-between items-start px-4 -mt-16 mb-3 relative z-10">
                <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-zinc-600 flex-shrink-0">
                    {user.isSuccess && user.data?.image
                        ? <img src={user.data.image} alt="avatar" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-zinc-600" />}
                </div>
                {user.data?.email === session?.user?.email ? (
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="mt-20 px-5 py-1.5 rounded-full font-bold bg-white text-black hover:bg-sky-400 transition-colors duration-200"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <button
                        onClick={() => followUser.mutate()}
                        disabled={followUser.isPending}
                        className="mt-20 px-5 py-1.5 rounded-full font-bold bg-white text-black hover:bg-sky-400 transition-colors duration-200 disabled:opacity-50"
                    >
                        {followUser.isPending ? "..." : user.data?.isFollowing ? "Unfollow" : "Follow"}
                    </button>
                )}
            </div>

            {/* Navn & handle */}
            <div className="px-4 mb-3">
                <p className="font-bold text-xl">{user.data?.name ?? "—"}</p>
                <p className="text-zinc-500 text-sm">@{user.data?.email?.toLowerCase().replace(/\s+/g, "") ?? "—"}</p>
            </div>

            {user.data?.bio && <div className="px-4 mb-3"><p className="text-zinc-300">{user.data.bio}</p></div>}

            {joinedDate && (
                <div className="px-4 mb-3 flex items-center gap-1 text-zinc-500 text-sm">
                    <span>🗓</span><span>Joined {joinedDate}</span>
                </div>
            )}

            {/* Followers/Following */}
            <div className="px-4 mb-4 flex gap-5 text-sm">
                <Link href={`/app/profile/${userId}/following`} className="hover:underline">
                    <span className="font-bold text-white">{user.data?.followingCount ?? 0}</span>
                    <span className="text-zinc-500"> Following</span>
                </Link>
                <Link href={`/app/profile/${userId}/followers`} className="hover:underline">
                    <span className="font-bold text-white">{user.data?.followerCount ?? 0}</span>
                    <span className="text-zinc-500"> Followers</span>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 min-w-fit px-3 py-3 text-sm font-medium transition relative whitespace-nowrap ${activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        {tab}
                        {activeTab === tab && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-sky-500 rounded-full" />}
                    </button>
                ))}
            </div>

            {/* ── Posts ── */}
            {activeTab === "Posts" && (
                postsQuery.isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : allPosts.length === 0 ? (
                    <div className="px-4 py-10 text-center text-zinc-500 text-sm">No posts yet.</div>
                ) : (
                    <>
                        {allPosts.map((post: Post) => <PostCard key={`${post.id}-${post.repostedBy?.id ?? "own"}`} post={post} />)}
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
                    </>
                )
            )}

            {/* ── Likes ── */}
            {activeTab === "Likes" && (
                likesQuery.isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (likesQuery.data?.length ?? 0) === 0 ? (
                    <div className="px-4 py-10 text-center text-zinc-500 text-sm">No liked posts yet.</div>
                ) : (
                    likesQuery.data!.map((post: Post) => <PostCard key={post.id} post={post} />)
                )
            )}

            {/* ── Media ── */}
            {activeTab === "Media" && (
                mediaQuery.isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (mediaQuery.data?.length ?? 0) === 0 ? (
                    <div className="px-4 py-10 text-center text-zinc-500 text-sm">No media yet.</div>
                ) : (
                    <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                        {mediaQuery.data!.map((post: Post) => (
                            <Link key={post.id} href={`/app/post/${post.id}`}>
                                <div className="aspect-square overflow-hidden bg-zinc-800">
                                    <img src={post.image!} alt="" className="w-full h-full object-cover hover:opacity-80 transition" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )
            )}

            {/* ── Highlights ── */}
            {activeTab === "Highlights" && <PremiumGate feature="Highlight posts" />}

            {/* ── Articles ── */}
            {activeTab === "Articles" && <PremiumGate feature="Write Articles" />}

            {showEditModal && user.isSuccess && (
                <EditProfileModal
                    user={{
                        id: user.data.id,
                        name: user.data.name ?? null,
                        email: user.data.email ?? null,
                        image: user.data.image ?? null,
                        bio: user.data.bio ?? null,
                        banner: user.data.banner ?? null,
                    }}
                    onClose={() => {
                        setShowEditModal(false);
                        queryClient.invalidateQueries({ queryKey: ["user", userId] });
                    }}
                />
            )}
        </div>
    );
}
