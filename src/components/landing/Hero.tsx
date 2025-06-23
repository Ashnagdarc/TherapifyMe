import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Zap } from "lucide-react";

//imported image assets
import userAvatar1 from "../../assets/images/LandingPage/avatar1.png";
import userAvatar2 from "../../assets/images/LandingPage/avatar2.png";
import userAvatar3 from "../../assets/images/LandingPage/avatar3.png";
import userAvatar4 from "../../assets/images/LandingPage/avatar4.png";

const avatarImgPaths = [
  userAvatar1,
  userAvatar2,
  userAvatar3,
  userAvatar4,
  userAvatar3,
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section id="home" className="py-20 md:py-28 bg-white dotted-background">
      <div className="w-full flex flex-col items-center gap-[1.5rem] px-6 text-center md:px-0 ">
        <div className="flex flex-col items-center justify-center gap-[0.7rem] md:flex-row md:gap-[0.4rem]">
          <div className=" w-[111px] h-[31.73] flex items-center">
            {avatarImgPaths.map((avatar, i) => (
              <img
                key={i}
                src={avatar}
                alt="a random user avatar"
                className={`h-[31px] w-[31px] rounded-full border z-[${
                  i + 1
                }] ${i !== 0 ? "ml-[-0.6rem]" : ""} `}
              />
            ))}
          </div>

          <span className="text-sm text-gray-600">
            Join 200+ people enjoying TherapifyMe today
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Think clearer. Feel
          <br />
          lighter. Speak freely.
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          TherapifyMe is a browser-based wellness companion that uses voice and
          empathetic AI for emotional check-ins anytime, anywhere.
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
        <div className="mt-20 px-8 flex justify-center">
          <img
            src="/Frame 26.png"
            alt="TherapifyMe app interface showing a conversation with the AI assistant"
            className="max-w-3xl w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
