import { FaXTwitter } from "react-icons/fa6";

export default function PremiumPage() {
    return (
        <div className="min-h-screen text-white w-full">
            <div className="px-4 py-3 border-b border-zinc-800">
                <p className="font-bold text-xl">Premium</p>
            </div>
            <div className="px-6 py-12 flex flex-col items-center text-center gap-4">
                <FaXTwitter className="w-12 h-12 fill-white" />
                <p className="font-black text-3xl">Get Premium</p>
                <p className="text-zinc-400 text-base max-w-sm">
                    Subscribe to unlock exclusive features, verification badge, and more — coming soon.
                </p>
                <button
                    disabled
                    className="mt-2 bg-white text-black font-bold px-8 py-3 rounded-full opacity-50 cursor-not-allowed text-sm"
                >
                    Coming soon
                </button>
            </div>
        </div>
    );
}
