import { MoodTrendData } from "../../services/analyticsService";

interface MoodTrendSidebarProps {
  trends: MoodTrendData[];
}

const dayMapping = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MoodTrendSidebar({ trends }: MoodTrendSidebarProps) {
  const getTrendForDay = (dayIndex: number) => {
    const dayStr = dayMapping[dayIndex];
    // This is a placeholder logic. In a real scenario, you'd map dates to days.
    return trends.find((t) => new Date(t.date).getDay() === dayIndex);
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-3 rounded-xl backdrop-blur-sm shadow-lg/40 shadow-black">
      <p className="text-xs text-grey-2 font-medium mb-2 text-center">
        7-Day Mood Trend
      </p>

      <div className="flex flex-col gap-[0.7rem]">
        {dayMapping.map((day, index) => {
          const trend = getTrendForDay(index);
          const hasData = trend && trend.count > 0;

          return (
            <div
              key={day}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-grey-2 w-6 font-medium text-xs">{day}</span>

              <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full mx-2 overflow-hidden">
                {hasData && (
                  <div
                    className="h-1.5 rounded-full bg-main transition-all duration-500 ease-out"
                    style={{ width: `${(trend.intensity / 10) * 100}%` }} // Example: intensity 0-10 scale
                  ></div>
                )}
              </div>

              <span className="text-slate-500 w-2">-</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
