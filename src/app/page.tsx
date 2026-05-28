"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {

  const { data: session } = useSession();

  if (session) {
    return (
      <div className="text-center mt-10">
        <p className="text-2xl font-bold">Welcome back, {session.user?.name ?? "user"}!</p>
        <button
          onClick={() => signOut()}
          className="text-red-500 hover:underline mt-4"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <p className="text-center text-2xl font-bold mt-10">
      You are not logged in, please{" "}
      <button
        onClick={() => signIn("github")}
        className="text-blue-500 hover:underline"
      >
        sign in with GitHub
      </button>
      .
      </p>
  );
}
