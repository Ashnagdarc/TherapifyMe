interface UserProgressProps {
  stats:
    | {
        totalEntries: number;
        activeDays: number;
        longestStreak: number;
      }
    | null
    | undefined;
}

export default function UserProgress({ stats }: UserProgressProps) {
  // Calculate progress percentages for visual indicators
  const entriesProgress = Math.min((stats?.totalEntries || 0) * 10, 100); // 10 entries = 100%
  const activeDaysProgress = Math.min((stats?.activeDays || 0) * 20, 100); // 5 days = 100%
  const streakProgress = Math.min((stats?.longestStreak || 0) * 10, 100); // 10 days = 100%

  const progressItems = [
    {
      label: "Entries",
      value: stats?.totalEntries || 0,
      suffix: "",
      progress: entriesProgress,
      color: "from-blue-400 to-blue-600",
      icon: "📝",
    },
    {
      label: "Active Days",
      value: stats?.activeDays || 0,
      suffix: "",
      progress: activeDaysProgress,
      color: "from-emerald-400 to-emerald-600",
      icon: "📅",
    },
    {
      label: "Best Streak",
      value: stats?.longestStreak || 0,
      suffix: "d",
      progress: streakProgress,
      color: "from-purple-400 to-purple-600",
      icon: "🔥",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-[1rem] bg-gradient-to-br from-slate-600 to-slate-800 p-3 rounded-xl borderbackdrop-blur-sm shadow-lg/40 shadow-black">
      <h4 className="text-xs text-slate-300 font-medium text-center">
        Your Progress
      </h4>

      <div className="w-full flex flex-col items-center gap-[1rem]">
        {progressItems.map((item, index) => (
          <div key={index} className="w-full flex flex-col gap-[0.5rem] ">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs">{item.icon}</span>
                <span className="text-xs text-slate-300">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-slate-100">
                {item.value}
                {item.suffix}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-1.5 bg-gradient-to-r ${item.color} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${item.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary badge */}
      <div className="p-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg border border-emerald-500/20">
        <div className="text-center">
          <span className="text-xs text-emerald-300 font-medium">
            {stats?.totalEntries === 0
              ? "🌱 Start!"
              : stats?.totalEntries && stats.totalEntries >= 10
              ? "🎉 Great!"
              : "📈 Keep going!"}
          </span>
        </div>
      </div>
    </div>
  );
}
