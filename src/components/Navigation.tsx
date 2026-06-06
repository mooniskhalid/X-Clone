"use client";
import { GoHomeFill } from "react-icons/go";           // 🏠 Home
import { FiSearch } from "react-icons/fi";             // 🔍 Search
import { FiBell } from "react-icons/fi";               // 🔔 Notifications
import { FiUserPlus } from "react-icons/fi";           // 👤+ Add user
import { FiMessageSquare } from "react-icons/fi";      // 💬 Messages
import { FiBookmark } from "react-icons/fi";           // 🔖 Bookmarks
import { FaXTwitter } from "react-icons/fa6";          // ✕ X logo
import { FiUser } from "react-icons/fi";               // 👤 Profile
import { GoKebabHorizontal } from "react-icons/go";    // ⋯ More
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export default function Navigation() {

        const user = useQuery({
            queryKey: ["user"],
            queryFn: api.getCurrentUser
        });

    return (
        <nav className="px-50 flex flex-col gap-4">
            <FaXTwitter className="w-15 h-9 fill-white flex-shrink-0"/>
            <Link href="/app" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <GoHomeFill className="w-7 h-7 flex-shrink-0"/>
                <span>Home</span>
            </Link>
            <Link href="/explore" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiSearch className="w-7 h-7 flex-shrink-0" />
                <span>Explore</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiBell className="w-7 h-7 flex-shrink-0" />
                <span>Notifications</span>
            </Link>
            <Link href="/follows" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiUserPlus className="w-7 h-7 flex-shrink-0"/>
                <span>Follows</span>
            </Link>
            <Link href="/chat" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiMessageSquare className="w-7 h-7 flex-shrink-0"/>
                <span>Chat</span>
            </Link>
            
            <Link href="/bookmarks" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiBookmark className="w-7 h-7 flex-shrink-0"/>
                <span>Bookmarks</span>
            </Link>
            <Link href="/premium" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FaXTwitter className="w-7 h-7 flex-shrink-0" />
                <span>Premium</span>
            </Link>
            <Link href={user.isSuccess ? "/app/profile/" + user.data.id : "/app"} className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <FiUser className="w-7 h-7 flex-shrink-0" />
                <span>Profile</span>
            </Link>
            <Link href="/more" className="flex items-center gap-3 text-lg font-semibold hover:bg-zinc-800 rounded-full px-4 py-3 transition-colors duration-200 w-fit">
                <GoKebabHorizontal className="w-7 h-7 flex-shrink-0"/>
                <span>More</span>
            </Link>
            
            <button className="bg-white text-black font-bold py-3 px-20 rounded-full w-fit">
                Post
            </button>
            <div className="mx-[80px] my-[150px]">
                <button onClick={() => signOut({ callbackUrl: "/" })} className="bg-zinc-900 text-white font-bold py-1 px-[50px] rounded-full w-fit whitespace-nowrap hover:bg-sky-400 transition-colors duration-200 ">
                    Sign Out
                </button>
            </div>
            
        </nav>
    );
}