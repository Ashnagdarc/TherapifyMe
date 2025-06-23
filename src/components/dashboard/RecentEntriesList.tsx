import { Entry } from "../../types/database";

interface RecentCheckinsSidebarProps {
  entries: Pick<Entry, "id" | "mood_tag" | "created_at">[];
}

export default function RecentCheckinsSidebar({
  entries,
}: RecentCheckinsSidebarProps) {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h4 className="text-sm text-gray-400 font-medium mb-3">
        Recent Check-ins
      </h4>
      {entries && entries.length > 0 ? (
        <div className="space-y-2">
          {entries.slice(0, 3).map((entry) => (
            <div key={entry.id} className="text-xs text-gray-300 capitalize">
              - {entry.mood_tag}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No entries yet</p>
      )}
    </div>
  );
}
