"use client";
import { signIn, useSession } from "next-auth/react";
import { FaGithub } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { redirect } from "next/navigation";


export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return redirect ('/app');
      {/*<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">
            Welcome back, {session.user?.name ?? "user"}!
          </p>
          <button
            onClick={() => signOut()}
            className="mt-6 px-6 py-2 rounded-full border border-gray-600 text-white hover:bg-gray-900 transition-colors duration-200"
          >
            Sign out
          </button>
        </div>
      </div>
      
    );*/}
  }

  return (
    <div className="min-h-screen bg-black flex items-center">
      {/* Left side – content */}
      <div className="flex-1 flex flex-col justify-center px-16 max-w-xl gap-10">
        {/* Mobile: show logo above heading */}
        <div className="flex md:hidden justify-start mb-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/X_logo_2023_%28white%29.png/500px-X_logo_2023_%28white%29.png"
            className="w-10 h-10"
            alt="X logo"
          />
        </div>

        <h1 className="text-white font-extrabold text-6xl leading-tight tracking-tight hover:text-sky-400 transition-colors duration-300">
          Happening now.
        </h1>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-white text-xl font-bold mb-2">Join today.</p>

          {/* Sign in button */}
          <button
            onClick={() => signIn("github")}
            className="flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-full py-2 px-6 hover:bg-sky-400 transition-colors duration-200 w-full"
          >
            {/* GitHub icon */}
            <FaGithub className="w-5 h-5" />
            Sign in with GitHub
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <p className="text-gray-500 text-xs mt-2">
            By signing up, you agree to the{" "}
            <button className="text-blue-400 hover:underline cursor-pointer">Terms of Service</button>{" "}
            and{" "}
            <button className="text-blue-400 hover:underline cursor-pointer">Privacy Policy</button>.
          </p>

          <div className="mt-6">
            <p className="text-white font-bold mb-3">Already have an account?</p>
            <button
              onClick={() => signIn("github")}
              className="w-full border border-gray-600 text-white font-semibold rounded-full py-3 px-6 hover:bg-sky-400 transition-colors duration-200"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      {/* Right side – large X logo */}
      {/*<div className="hidden md:flex flex-1 items-center justify-center group">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/X_logo_2023_%28white%29.png/500px-X_logo_2023_%28white%29.png"
          className="w-96 h-96 opacity-90 transition-opacity duration-300 group-hover:opacity-0"
          alt="X logo"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/sco/thumb/9/9f/Twitter_bird_logo_2012.svg/250px-Twitter_bird_logo_2012.svg.png"
          className="w-106 h-82 absolute opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          alt="X logo hover"
        />
      </div>*/}
      <div className="hidden md:flex flex-1 items-center justify-center relative group">
        <FaXTwitter className="w-156 h-176 text-white absolute transition-opacity duration-300 opacity-100 group-hover:opacity-0" size={200} />
        <FaTwitter className="w-96 h-96 text-sky-400 absolute transition-opacity duration-300 opacity-0 group-hover:opacity-100" size={200} />
        
      </div>
    </div>
  );
}