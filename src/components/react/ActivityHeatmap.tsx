import { useState, useMemo } from "react";
import type { ActivityDay, HeatmapData } from "../../utils/activityData";
import { getIntensityLevel, activityToArray } from "../../utils/activityData";

interface ActivityHeatmapProps {
  data: HeatmapData;
}

type ViewMode = "created" | "updated";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("created");
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Get the active activity data based on view mode
  const activeActivity = useMemo(() => {
    const activityMap =
      viewMode === "created" ? data.creationActivity : data.updateActivity;
    return activityToArray(activityMap);
  }, [data, viewMode]);

  // Group days by week (starting on Sunday)
  const weeks = useMemo(() => {
    const weekGroups: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];

    // Start with the first date in the range
    const startDate = data.dateRange.start;
    const startDayOfWeek = startDate.getDay();

    // Fill in empty cells before the first date
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: "",
        count: -1, // sentinel value for empty cells
        notes: [],
      });
    }

    // Process each day
    activeActivity.forEach((day, index) => {
      currentWeek.push(day);

      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      // If Saturday or last day, start new week
      if (dayOfWeek === 6 || index === activeActivity.length - 1) {
        // Fill remaining cells in week if needed
        while (currentWeek.length < 7) {
          currentWeek.push({
            date: "",
            count: -1,
            notes: [],
          });
        }
        weekGroups.push(currentWeek);
        currentWeek = [];
      }
    });

    return weekGroups;
  }, [activeActivity, data.dateRange.start]);

  // Calculate month labels (show month name at start of each month)
  const monthLabels = useMemo(() => {
    const labels: { week: number; month: string }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      week.forEach((day) => {
        if (day.count === -1) return; // Skip empty cells

        const date = new Date(day.date);
        const month = date.getMonth();

        if (month !== lastMonth) {
          labels.push({
            week: weekIndex,
            month: MONTHS[month],
          });
          lastMonth = month;
        }
      });
    });

    return labels;
  }, [weeks]);

  const handleMouseMove = (e: React.MouseEvent, day: ActivityDay) => {
    setHoveredDay(day);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Calculate total notes in current view
  const totalNotes = useMemo(() => {
    return activeActivity.reduce((sum, day) => sum + day.count, 0);
  }, [activeActivity]);

  return (
    <div className="activity-heatmap w-full">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-theme-dark mb-2">Activity</h2>
          <p className="text-sm text-theme-darkgray">
            {totalNotes}{" "}
            {viewMode === "created" ? "notes created" : "notes updated"} in the
            last year
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 bg-theme-lightgray p-1 rounded-lg border border-theme-gray">
          <button
            onClick={() => setViewMode("created")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === "created"
                ? "bg-theme-light text-theme-tertiary shadow-sm"
                : "text-theme-darkgray hover:text-theme-dark"
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setViewMode("updated")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === "updated"
                ? "bg-theme-light text-theme-tertiary shadow-sm"
                : "text-theme-darkgray hover:text-theme-dark"
            }`}
          >
            Updated
          </button>
        </div>
      </div>

      {/* Heatmap container */}
      <div className="relative overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 pl-8" style={{ gap: "3px" }}>
            {monthLabels.map((label, index) => (
              <div
                key={index}
                className="text-xs text-theme-darkgray"
                style={{
                  marginLeft: index === 0 ? `${label.week * 15}px` : "0",
                  minWidth: "40px",
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Day labels + grid */}
          <div className="flex gap-1">
            {/* Day labels (Sun-Sat) */}
            <div className="flex flex-col gap-[3px] pr-2">
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className="text-xs text-theme-darkgray h-[12px] flex items-center"
                  style={{
                    opacity: index % 2 === 0 ? 1 : 0, // Show every other day
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => {
                    const intensity =
                      day.count >= 0 ? getIntensityLevel(day.count) : 0;
                    const isEmpty = day.count === -1;

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-[12px] h-[12px] rounded-sm cursor-pointer transition-all ${
                          isEmpty
                            ? "opacity-0"
                            : intensity === 0
                              ? "bg-theme-gray hover:border hover:border-theme-darkgray"
                              : "border border-theme-tertiary"
                        }`}
                        style={
                          !isEmpty && intensity > 0
                            ? {
                                backgroundColor: "var(--color-tertiary)",
                                opacity:
                                  intensity === 1
                                    ? 0.25
                                    : intensity === 2
                                      ? 0.5
                                      : intensity === 3
                                        ? 0.7
                                        : 1,
                              }
                            : undefined
                        }
                        onMouseMove={(e) => !isEmpty && handleMouseMove(e, day)}
                        onMouseLeave={handleMouseLeave}
                        title={
                          isEmpty
                            ? ""
                            : `${day.date}: ${day.count} ${day.count === 1 ? "note" : "notes"}`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-theme-darkgray">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-[12px] h-[12px] rounded-sm ${
                    level === 0
                      ? "bg-theme-gray"
                      : "border border-theme-tertiary"
                  }`}
                  style={
                    level > 0
                      ? {
                          backgroundColor: "var(--color-tertiary)",
                          opacity:
                            level === 1
                              ? 0.25
                              : level === 2
                                ? 0.5
                                : level === 3
                                  ? 0.7
                                  : 1,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredDay.count >= 0 && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${mousePos.x + 10}px`,
            top: `${mousePos.y + 10}px`,
          }}
        >
          <div className="bg-theme-dark text-theme-light px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs">
            <div className="font-semibold mb-1">
              {new Date(hoveredDay.date).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="mb-1">
              {hoveredDay.count} {hoveredDay.count === 1 ? "note" : "notes"}
            </div>
            {hoveredDay.notes.length > 0 && (
              <div
                className="text-xs opacity-80 mt-2 border-t pt-2"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
              >
                {hoveredDay.notes.slice(0, 5).map((note, index) => (
                  <div key={index} className="truncate">
                    {note}
                  </div>
                ))}
                {hoveredDay.notes.length > 5 && (
                  <div className="italic">
                    +{hoveredDay.notes.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
