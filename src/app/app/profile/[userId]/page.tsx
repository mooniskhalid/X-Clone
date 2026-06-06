"use client";
import { useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import api from "@/lib/axios";
import { useParams } from "next/navigation";
import { redirect } from "next/navigation";
import { useRef, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Profile() {

    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Posts");
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [bannerImage, setBannerImage] = useState<string | null>(null);

    const user = useQuery({
        queryKey: ["user", params.userId],
        queryFn: () => api.getUser(params.userId as string),
    });

    const queryClient = useQueryClient();

    const followUser = useMutation({
        mutationFn: () => api.followUser(params.userId as string),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user", params.userId] });
        },
        onError: (error) => {
            console.error("followUser failed:", error);
        },
    });

    if (user.isError) {
        return redirect("/app");
    }

    const tabs = ["Posts", "Replies", "Highlights", "Articles", "Media"];

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
                    <p className="text-sm text-zinc-500">0 posts</p>
                </div>
            </div>

            {/* Banner */}
            <div className="w-full h-48 bg-zinc-700 relative group cursor-pointer overflow-hidden" onClick={() => bannerInputRef.current?.click()}>
                {bannerImage ? (
                    <img src={bannerImage} alt="banner" className="w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-white text-sm font-medium">📷 Change banner</span>
                </div>
            </div>
            <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setBannerImage(URL.createObjectURL(file));
                }}
            />

            {/* Avatar + Follow button */}
            <div className="flex justify-between items-start px-4 -mt-16 mb-3 relative z-10">
                <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-zinc-600 flex-shrink-0">
                    {user.isSuccess && user.data?.image ? (
                        <img src={user.data.image} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-zinc-600" />
                    )}
                </div>
                {user.data?.email === session?.user?.email ? ( 
                    <button className="mt-20 px-5 py-1.5 rounded-full border border-zinc-600 font-semibold bg-white text-black hover:bg-zinc-800 transition">
                        Edit Profile
                    </button>
                    ) : (
                    <button onClick={() => followUser.mutate()} disabled={followUser.isPending}
                        className="mt-20 px-5 py-1.5 rounded-full border border-zinc-600 font-semibold bg-white text-black hover:bg-zinc-800 transition disabled:opacity-50"
                    >
                        {followUser.isPending ? "..." : user.data?.isFollowing ? "Unfollow" : "Follow"}
                    </button>
                    
                )} 
            </div>

            {/* Name & handle */}
            <div className="px-4 mb-3">
                <p className="font-bold text-xl">{user.data?.name ?? "—"}</p>
                <p className="text-zinc-500 text-sm">
                    @{user.data?.email?.toLowerCase().replace(/\s+/g, "") ?? "—"}
                </p>
            </div>

            {/*Bio*/}
            <div className="px-4 mb-3">
                <p className="text-zinc-300">{user.data?.bio ?? "No bio available."}</p>
            </div>

            {/* Joined date */}
            {joinedDate && (
                <div className="px-4 mb-3 flex items-center gap-1 text-zinc-500 text-sm">
                    <span>🗓</span>
                    <span>Joined {joinedDate}</span>
                </div>
            )}

            {/* Following / Followers */}
            <div className="px-4 mb-4 flex gap-5 text-sm">
                <span><span className="font-bold text-white">{user.data?.followingCount ?? 0}</span> <span className="text-zinc-500">Following</span></span>
                <span><span className="font-bold text-white">{user.data?.followerCount ?? 0}</span> <span className="text-zinc-500">Followers</span></span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition relative ${
                            activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-sky-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content placeholder */}
            <div className="px-4 py-10 text-center text-zinc-500 text-sm">
                No {activeTab.toLowerCase()} yet.
            </div>
        </div>
    );
}
