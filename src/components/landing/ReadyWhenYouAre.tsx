import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Sparkles } from "lucide-react";

import FadeInOnScroll from "../ui/FadeIn";

export default function ReadyWhenYouAre() {
  const navigate = useNavigate();

  return (
    <FadeInOnScroll className="py-24 bg-gray-50 dotted-background">
      <div className="container mx-auto px-6 text-center">
        <p className="text-3xl md:text-[67.24px] font-bold text-text-blue">
          Ready when you are.
        </p>
        <p className="mt-6 text-[14.71px] text-text-blue max-w-xl mx-auto">
          No app stores. No therapy clichés. Just you, your voice, and a web app
          that listens back.
        </p>
        <Button
          onClick={() => navigate("/auth")}
          variant="primary"
          size="lg"
          className="mt-10"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Get Started
        </Button>
      </div>
    </FadeInOnScroll>
  );
}
