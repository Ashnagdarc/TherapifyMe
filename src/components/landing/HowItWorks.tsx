export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-6 flex flex-col items-center">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-semibold">Step by step</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            How It Works
          </h2>
        </div>
        <img
          src="/Frame 118.png"
          alt="A diagram showing the five steps of using TherapifyMe: Sign Up, Speak How You Feel, Calm Voice Response, Track Your Mood, and Get Weekly Video Guidance."
          className="max-w-4xl w-full h-auto"
        />
      </div>
    </section>
  );
}
