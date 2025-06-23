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
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h4 className="text-sm text-gray-400 font-medium mb-3">Your Progress</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-300">Total Entries</span>
          <span className="text-white font-medium">
            {stats?.totalEntries || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Active Days</span>
          <span className="text-white font-medium">
            {stats?.activeDays || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Longest Streak</span>
          <span className="text-white font-medium">
            {stats?.longestStreak || 0} days
          </span>
        </div>
      </div>
    </div>
  );
}
