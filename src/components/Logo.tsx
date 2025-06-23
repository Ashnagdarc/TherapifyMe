import LogoImg from "../assets/images/Logo.png";

export default function Logo() {
  return (
    <img
      src={LogoImg}
      alt="TherapifyMe Logo"
      className="w-8 h-8 md:w-[36px] md:h-[36px]"
    />
  );
}
