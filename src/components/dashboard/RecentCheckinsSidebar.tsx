import { Entry } from "../../types/database";

interface RecentCheckinsSidebarProps {
  entries: Pick<Entry, "id" | "mood_tag" | "created_at">[];
}

const moodEmojis: { [key: string]: string } = {
  happy: "😊",
  content: "😌",
  excited: "🤩",
  grateful: "🙏",
  sad: "😢",
  anxious: "😰",
  stressed: "😓",
  frustrated: "😤",
  angry: "😠",
  overwhelmed: "🤯"
};

const moodColors: { [key: string]: string } = {
  happy: "text-yellow-400",
  content: "text-green-400",
  excited: "text-purple-400",
  grateful: "text-blue-400",
  sad: "text-blue-500",
  anxious: "text-orange-400",
  stressed: "text-red-400",
  frustrated: "text-red-500",
  angry: "text-red-600",
  overwhelmed: "text-pink-400"
};

export default function RecentCheckinsSidebar({
  entries,
}: RecentCheckinsSidebarProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-600/10 to-slate-700/20 p-3 rounded-xl border border-slate-600/20 backdrop-blur-sm">
      <h4 className="text-xs text-slate-300 font-medium mb-2 text-center">
        Recent Check-ins
      </h4>
      {entries && entries.length > 0 ? (
        <div className="space-y-1.5">
          {entries.slice(0, 3).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-slate-600/20">
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {moodEmojis[entry.mood_tag] || "💭"}
                </span>
                <div>
                  <span className={`text-xs font-medium capitalize ${moodColors[entry.mood_tag] || "text-slate-300"}`}>
                    {entry.mood_tag}
                  </span>
                  <p className="text-xs text-slate-400">
                    {formatTimeAgo(entry.created_at)}
                  </p>
                </div>
              </div>
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3">
          <div className="text-xl mb-1">🌱</div>
          <p className="text-xs text-slate-400">No entries yet</p>
        </div>
      )}
    </div>
  );
}
