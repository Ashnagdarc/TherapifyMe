import WeeklyVideoSection from "../WeeklyVideoSection";

interface TherapySessionProps {
  userId: string;
}

export default function TherapySession({ userId }: TherapySessionProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/20 p-3 rounded-xl border border-indigo-500/20 backdrop-blur-sm">
      <h4 className="text-xs text-indigo-300 font-medium mb-2 text-center">Weekly Video</h4>
      <WeeklyVideoSection userId={userId} />
    </div>
  );
}
