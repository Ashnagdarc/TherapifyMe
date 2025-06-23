export default function ForMindsThatMultitask() {
  // Placeholder image URL from Unsplash - captures a similar mood.
  const backgroundImageUrl = "/12.jpg";

  return (
    <section
      id="for-minds"
      className="relative bg-gray-800 text-white py-24 md:py-32 bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold">
          For minds that multitask
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">
          Whether you're managing anxiety at midnight, decompressing between
          calls, or just need a mental reset—TherapifyMe runs in your browser,
          optimized for quiet, intelligent care.
        </p>
      </div>
    </section>
  );
}
