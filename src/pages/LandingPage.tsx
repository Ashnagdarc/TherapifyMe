// imported components
import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import ForMindsThatMultitask from "../components/landing/ForMindsThatMultitask";
import WhyDifferent from "../components/landing/WhyDifferent";
import ReadyWhenYouAre from "../components/landing/ReadyWhenYouAre";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800 overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <ForMindsThatMultitask />
        <WhyDifferent />
        <ReadyWhenYouAre />
      </main>
      <Footer />
    </div>
  );
}
