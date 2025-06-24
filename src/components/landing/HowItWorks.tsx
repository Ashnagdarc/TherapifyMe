import FadeInOnScroll from "../ui/FadeIn";

export default function HowItWorks() {
  return (
    <FadeInOnScroll id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-6 flex flex-col items-center">
        <div className=" flex flex-col items-center gap-[1rem] text-center mb-12">
          <span className="font-[500] text-text-blue leading-[100%] md:text-[17.64px] ">
            Step by step
          </span>
          <h2 className="text-3xl md:text-[80.64px] font-[700] text-text-blue">
            How It Works
          </h2>
        </div>
        <img
          src="/Frame 118.png"
          alt="A diagram showing the five steps of using TherapifyMe: Sign Up, Speak How You Feel, Calm Voice Response, Track Your Mood, and Get Weekly Video Guidance."
          className="max-w-4xl w-full h-auto"
        />
      </div>
    </FadeInOnScroll>
  );
}
