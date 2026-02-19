"use client"; // Add this if using App Router

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    // Redirect immediately when component mounts
    router.push("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black">
            Redirecting to login...
          </h1>
        </div>
      </main>
    </div>
  );
}
