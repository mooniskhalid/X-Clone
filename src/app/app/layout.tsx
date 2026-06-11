import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { RightSidebar } from "@/components/RightSidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) return redirect("/");

    return (
        <div className="min-h-screen">
            {/* Desktop layout: spacer + content + sidebar */}
            <div className="hidden md:grid md:grid-cols-[300px_1fr_350px] min-h-screen">
                {/* Spacer for fixed nav (300px wide) */}
                <div />
                <div className="border-x border-zinc-900">
                    {children}
                </div>
                <div className="hidden lg:flex flex-col p-4 sticky top-0 h-screen overflow-y-auto">
                    <RightSidebar />
                </div>
            </div>

            {/* Mobile layout: full width, padded bottom for nav bar */}
            <div className="md:hidden pb-16">
                {children}
            </div>

            {/* Navigation handles its own desktop/mobile rendering */}
            <Navigation />
        </div>
    );
}
