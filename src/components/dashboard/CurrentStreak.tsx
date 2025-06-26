interface CurrentStreakProps {
  days: number;
}

export default function CurrentStreak({ days }: CurrentStreakProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-300 p-3 rounded-xl border border-emerald-500/20 backdrop-blur-sm shadow-lg/40 shadow-black">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs text-grey-2 font-medium">Current Streak</h4>
          <p className="text-xl font-semibold text-grey-2 mt-0.5">
            {days} <span className="text-sm text-grey-2">days</span>
          </p>
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400/20 to-emerald-500/30 rounded-full flex items-center justify-center">
          <span className="text-emerald-200 text-sm">🔥</span>
        </div>
      </div>
    </div>
  );
}
