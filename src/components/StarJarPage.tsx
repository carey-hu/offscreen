import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { MoodEntry } from "../types";
import { MoodEntryModal } from "./MoodEntryModal";
import { StarJarCalendar } from "./StarJarCalendar";
import { StarJarView } from "./StarJarView";

interface Props {
  entries: MoodEntry[];
  onUpsert: (entry: MoodEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function computeStreak(entries: MoodEntry[]): number {
  const dateSet = new Set<string>();
  entries.forEach((e) => dateSet.add(e.date));

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // If neither today nor yesterday has entries, streak is 0
  if (!dateSet.has(today) && !dateSet.has(yesterday)) return 0;

  let streak = 0;
  // Count from today backwards
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (dateSet.has(d)) {
      streak++;
    } else if (i === 0) {
      // Today has no entries — streak from yesterday still counts
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function StarJarPage({ entries, onUpsert, onDelete }: Props) {
  const [view, setView] = useState<"jar" | "calendar">("jar");
  const [modalDate, setModalDate] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayCount = useMemo(
    () => entries.filter((e) => e.date === todayStr).length,
    [entries, todayStr]
  );
  const streak = useMemo(() => computeStreak(entries), [entries]);

  const modalEntries = useMemo(
    () => (modalDate ? entries.filter((e) => e.date === modalDate) : []),
    [entries, modalDate]
  );

  return (
    <div className="pt-4 sm:pt-8 pb-12">
      {view === "jar" ? (
        <StarJarView
          entries={entries}
          todayCount={todayCount}
          streak={streak}
          onViewCalendar={() => setView("calendar")}
        />
      ) : (
        <StarJarCalendar
          entries={entries}
          onSelectDate={(date) => setModalDate(date)}
          onBack={() => setView("jar")}
        />
      )}

      <MoodEntryModal
        open={modalDate !== null}
        date={modalDate ?? ""}
        entries={modalEntries}
        onClose={() => setModalDate(null)}
        onUpsert={onUpsert}
        onDelete={onDelete}
      />
    </div>
  );
}
