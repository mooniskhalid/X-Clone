import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { RightSidebar } from "@/components/RightSidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) return redirect("/");

    return (
        <>
            {/* Content: full width on mobile, offset for nav+sidebar on desktop */}
            <div className="md:ml-[300px] lg:mr-[350px] border-x border-zinc-900 min-h-screen pb-16 md:pb-0">
                {children}
            </div>

            {/* Right sidebar: fixed on desktop */}
            <div className="hidden lg:flex flex-col fixed right-0 top-0 w-[350px] h-screen overflow-y-auto p-4">
                <RightSidebar />
            </div>

            {/* Navigation handles desktop sidebar + mobile bottom bar */}
            <Navigation />
        </>
    );
}
