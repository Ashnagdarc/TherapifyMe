import WeeklyVideoSection from "../WeeklyVideoSection";

interface TherapySessionProps {
  userId: string;
}

export default function TherapySession({ userId }: TherapySessionProps) {
  return (
    <div className=" flex flex-col items-center py-[1rem] pb-[2rem] bg-gradient-to-br from-indigo-500 to-purple-500 p-3 rounded-xl backdrop-blur-sm shadow-lg/40 shadow-black">
      <h4 className="text-xs text-grey-2 font-medium mb-2 text-center">
        Weekly Video
      </h4>
      <WeeklyVideoSection userId={userId} />
    </div>
  );
}
