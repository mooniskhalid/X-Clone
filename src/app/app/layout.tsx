import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if(!session) {

    return redirect('/');
  }

    return (
        <div className="grid grid-cols-4 min-h-screen">
            <div className="col-span-1 p-4">
                <Navigation/>
            </div>
            <div className="col-span-2 border-x border-zinc-900">
                {children}
            </div>
            <div className="col-span-1 p-4">
                Sidebar
            </div>
        </div>
    );
}