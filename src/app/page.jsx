"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";

const Home = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-12 text-white">
      <div className="flex items-center gap-3">
        <BookOpen className="h-10 w-10 text-purple-600" />
        <h1 className="text-4xl font-bold">Lexi-Ease</h1>
      </div>

      <div className="max-w-md text-center">
        <p className="text-xl leading-relaxed mb-8">
          Tools and resources designed specifically for dyslexic learners,
          helping you discover your full potential.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full items-center justify-center max-w-xs">
        <Button
          onClick={() => router.push("/login")}
          className="bg-purple-600 hover:bg-purple-700 text-lg py-6 w-full"
        >
          Login
        </Button>
        <Button
          onClick={() => router.push("/signup")}
          variant="outline"
          className="text-lg py-6 w-full text-black hover:bg-white/60 border-none"
        >
          Sign Up
        </Button>
      </div>

      <p className="text-stone-600 mt-4">
        New to Lexi-Ease?{" "}
        <span
          className="text-purple-600 font-medium cursor-pointer hover:underline"
          onClick={() => router.push("/about")}
        >
          Learn more about our approach
        </span>
      </p>
    </div>
  );
};

export default Home;
