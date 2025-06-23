interface CurrentStreakProps {
  days: number;
}

export default function CurrentStreak({ days }: CurrentStreakProps) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h4 className="text-sm text-gray-400 font-medium">Current Streak</h4>
      <p className="text-2xl font-bold text-white mt-1">{days} days</p>
    </div>
  );
}
