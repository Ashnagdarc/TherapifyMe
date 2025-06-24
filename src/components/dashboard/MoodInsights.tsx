interface MoodInsightsProps {
  mood: string | undefined;
}

const moodData: { [key: string]: { emoji: string; color: string; bgColor: string; message: string; } } = {
  happy: {
    emoji: "😊",
    color: "text-yellow-400",
    bgColor: "from-yellow-500/10 to-yellow-600/20",
    message: "You're radiating positivity!"
  },
  content: {
    emoji: "😌",
    color: "text-green-400",
    bgColor: "from-green-500/10 to-green-600/20",
    message: "Balanced and peaceful"
  },
  excited: {
    emoji: "🤩",
    color: "text-purple-400",
    bgColor: "from-purple-500/10 to-purple-600/20",
    message: "Energy is flowing!"
  },
  grateful: {
    emoji: "🙏",
    color: "text-blue-400",
    bgColor: "from-blue-500/10 to-blue-600/20",
    message: "Appreciation opens hearts"
  },
  sad: {
    emoji: "😢",
    color: "text-blue-500",
    bgColor: "from-blue-500/10 to-slate-600/20",
    message: "It's okay to feel this way"
  },
  anxious: {
    emoji: "😰",
    color: "text-orange-400",
    bgColor: "from-orange-500/10 to-orange-600/20",
    message: "Take deep breaths"
  },
  stressed: {
    emoji: "😓",
    color: "text-red-400",
    bgColor: "from-red-500/10 to-red-600/20",
    message: "Remember to pause"
  },
  frustrated: {
    emoji: "😤",
    color: "text-red-500",
    bgColor: "from-red-500/10 to-red-600/20",
    message: "This feeling will pass"
  },
  overwhelmed: {
    emoji: "🤯",
    color: "text-pink-400",
    bgColor: "from-pink-500/10 to-pink-600/20",
    message: "One step at a time"
  }
};

export default function MoodInsights({ mood }: MoodInsightsProps) {
  const currentMood = mood && moodData[mood] ? moodData[mood] : null;

  if (!currentMood) {
    return (
      <div className="bg-gradient-to-br from-slate-600/10 to-slate-700/20 p-3 rounded-xl border border-slate-600/20 backdrop-blur-sm">
        <h4 className="text-xs text-slate-300 font-medium mb-2 text-center">Mood Insights</h4>
        <div className="text-center py-2">
          <div className="text-lg mb-1">🌟</div>
          <p className="text-xs text-slate-400">Track mood</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${currentMood.bgColor} p-3 rounded-xl border border-slate-600/20 backdrop-blur-sm`}>
      <h4 className="text-xs text-slate-300 font-medium mb-2 text-center">Mood Insights</h4>

      <div className="space-y-2">
        {/* Current dominant mood */}
        <div className="flex items-center justify-center space-x-2 p-2 bg-slate-800/30 rounded-lg">
          <span className="text-lg">{currentMood.emoji}</span>
          <div className="text-center">
            <p className={`text-xs font-semibold capitalize ${currentMood.color}`}>
              {mood}
            </p>
          </div>
        </div>

        {/* Insight message */}
        <div className="text-center p-2 bg-slate-800/20 rounded-lg">
          <p className="text-xs text-slate-300 italic">
            "{currentMood.message}"
          </p>
        </div>
      </div>
    </div>
  );
}
