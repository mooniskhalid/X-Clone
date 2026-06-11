"use client";
import { GoHomeFill } from "react-icons/go";
import { FiSearch, FiBell, FiUserPlus, FiUser, FiLogOut } from "react-icons/fi";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useState } from "react";
import { CreatePostModal } from "@/components/CreatePostModal";

export default function Navigation() {
    const user = useQuery({ queryKey: ["currentUser"], queryFn: api.getCurrentUser });

    const notifications = useQuery({
        queryKey: ["notificationsCount"],
        queryFn: api.getNotifications,
        refetchInterval: 60_000,
    });
    const unreadCount = notifications.data?.unreadCount ?? 0;

    const [showCreateModal, setShowCreateModal] = useState(false);

    const profileHref = user.isSuccess ? "/app/profile/" + user.data.id : "/app/profile";

    return (
        <>
        {/* Desktop sidebar — hidden on mobile */}
        <nav className="hidden md:flex flex-col gap-4 fixed top-0 left-0 h-screen w-[300px] p-4">
            <FaXTwitter className="w-15 h-9 fill-white flex-shrink-0"/>

            <Link href="/app" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <GoHomeFill className="w-7 h-7 flex-shrink-0"/>
                <span>Home</span>
            </Link>

            <Link href="/app/explore" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiSearch className="w-7 h-7 flex-shrink-0" />
                <span>Explore</span>
            </Link>

            <Link href="/app/notifications" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <div className="relative">
                    <FiBell className="w-7 h-7 flex-shrink-0" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-sky-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
                <span>Notifications</span>
            </Link>

            <Link href="/app/follows" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiUserPlus className="w-7 h-7 flex-shrink-0"/>
                <span>Follows</span>
            </Link>

            <Link href="/app/premium" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FaXTwitter className="w-7 h-7 flex-shrink-0" />
                <span>Premium</span>
            </Link>

            <Link href={profileHref} className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiUser className="w-7 h-7 flex-shrink-0" />
                <span>Profile</span>
            </Link>

            <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-black font-bold py-3 px-20 rounded-full w-fit hover:bg-sky-400 transition-colors duration-200"
            >
                Post
            </button>

            <div className="mt-auto mb-6">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="bg-zinc-900 text-white font-bold py-1 px-[40px] rounded-full w-fit whitespace-nowrap hover:bg-sky-400 transition-colors duration-200"
                >
                    Sign Out
                </button>
            </div>
        </nav>

        {/* Mobile bottom bar — hidden on desktop */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800 flex items-center justify-around px-2 py-2">
            <Link href="/app" className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <GoHomeFill className="w-6 h-6" />
            </Link>
            <Link href="/app/explore" className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <FiSearch className="w-6 h-6" />
            </Link>
            <button
                onClick={() => setShowCreateModal(true)}
                className="bg-sky-500 hover:bg-sky-400 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
            >
                +
            </button>
            <Link href="/app/notifications" className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <FiBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-sky-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Link>
            <Link href={profileHref} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                <FiUser className="w-6 h-6" />
            </Link>
            <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
                <FiLogOut className="w-6 h-6" />
            </button>
        </nav>

        {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}
        </>
    );
}
