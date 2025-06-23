import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Zap } from "lucide-react";

export default function ReadyWhenYouAre() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gray-50 dotted-background">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Ready when you are.
        </h2>
        <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto">
          No app stores. No therapy clichés. Just you, your voice, and a web app
          that listens back.
        </p>
        <Button
          onClick={() => navigate("/auth")}
          variant="primary"
          size="lg"
          className="mt-10"
        >
          <Zap className="w-5 h-5 mr-2" />
          Get Started
        </Button>
      </div>
    </section>
  );
}
