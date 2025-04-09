"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Book, Lock, Pointer, Speech } from "lucide-react";
import { useRouter } from "next/navigation";

const DISABLE_TEXT_CUSTOMIZATION = false;
const DISABLE_TEXT_TO_SPEECH = true;
const DISABLE_INTERACTIVE_LEARNING = true;

const Onboarding = () => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center bg-purpleApp">
      <Card className="bg-purple-950/20 border-none">
        <CardContent className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
          <Button
            className="flex items-center justify-center gap-2 min-w-[200px] h-20 hover:bg-purple-950/20 cursor-pointer"
            disabled={DISABLE_TEXT_CUSTOMIZATION}
            onClick={() => {
              router.push("/file-previewer");
            }}
          >
            <Book className="size-6" />
            Text Customization
          </Button>
          <div className="relative">
            <Button
              className="flex items-center justify-center gap-2 min-w-[200px] h-20 hover:bg-purple-950/20 cursor-pointer"
              disabled={DISABLE_TEXT_TO_SPEECH}
            >
              <Speech className="size-6" />
              Text-To-Speech
            </Button>
            <Lock className="size-6 absolute -top-1 -right-2 text-white" />
          </div>
          <div className="relative">
            <Button
              className="flex items-center justify-center gap-2 min-w-[200px] h-20  hover:bg-purple-950/20 cursor-pointer"
              disabled={DISABLE_INTERACTIVE_LEARNING}
            >
              <Pointer className="size-6" />
              Interactive Learning
            </Button>
            <Lock className="size-6 absolute -top-1 -right-2 text-white" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
