export default function ForMindsThatMultitask() {
  // Placeholder image URL from Unsplash - captures a similar mood.
  const backgroundImageUrl = "/12.jpg";

  return (
    <section
      id="for-minds"
      className="w-full text-white bg-gray-800 bg-cover bg-center md:h-[578.72px] md:py-0 md:bg-[position:30%_30%] "
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="w-full h-full flex items-center justify-center bg-black/40 py-24 md:py-0">
        <div className=" flex flex-col items-center gap-[2rem] px-6 text-center z-10 md:w-[721.2px] md:px-0 ">
          <p className="font-[700] text-3xl tracking-[-0.89px] md:text-[80.69px] md:leading-[85.74px] ">
            For minds that multitask
          </p>

          <p className="text-lg tracking-[-0.5px] md:w-full md:font-[500] md:text-[20px] md:leading-[27.74px] ">
            Whether you're managing anxiety at midnight, decompressing between
            calls, or just need a mental reset—TherapifyMe runs in your browser,
            optimized for quiet, intelligent care.
          </p>
        </div>
      </div>
    </section>
  );
}
