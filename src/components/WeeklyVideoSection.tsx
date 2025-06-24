import { useState, useEffect } from "react";
import { WeeklyVideoService } from "../services/weeklyVideoService";
import WeeklyVideoPlayer from "./WeeklyVideoPlayer";
import { TavusVideo } from "../types/database";
import { Button } from "./ui/Button";
import { Play, Loader2, Calendar } from "lucide-react";

interface WeeklyVideoSectionProps {
  userId: string;
}

export default function WeeklyVideoSection({
  userId,
}: WeeklyVideoSectionProps) {
  const [weeklyVideo, setWeeklyVideo] = useState<TavusVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentWeek = getCurrentWeekNumber();

  useEffect(() => {
    if (userId) {
      fetchWeeklyVideo();
    }
  }, [userId]);

  const fetchWeeklyVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      const video = await WeeklyVideoService.getWeeklyVideo(userId);
      setWeeklyVideo(video);
    } catch (err) {
      console.error("Error fetching weekly video:", err);
      setError("Failed to load weekly video");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      setGenerating(true);
      setError(null);
      const video = await WeeklyVideoService.generateWeeklyVideo(userId);
      if (video) {
        setWeeklyVideo(video);
      }
    } catch (err) {
      console.error("Error generating weekly video:", err);
      setError("Failed to generate weekly video. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  function getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
    );
    return weekNumber;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <Button
          onClick={fetchWeeklyVideo}
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!weeklyVideo) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-gray-400 text-sm mb-3">
          No therapy video for week {currentWeek} yet
        </p>
        <p className="text-gray-500 text-xs mb-4">
          Complete a few check-ins this week to generate your personalized
          therapy session
        </p>
        <Button
          onClick={handleGenerateVideo}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Generate Video
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Week {currentWeek} • {weeklyVideo.title || "Therapy Session"}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(weeklyVideo.created_at).toLocaleDateString()}
        </p>
      </div>

      <WeeklyVideoPlayer
        videoUrl={weeklyVideo.tavus_video_url}
        title={weeklyVideo.title || `Week ${currentWeek} Therapy Session`}
        onGenerateNewVideo={handleGenerateVideo}
        isGenerating={generating}
      />
    </div>
  );
}
