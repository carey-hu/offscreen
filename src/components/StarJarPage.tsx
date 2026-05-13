import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { MoodEntry } from "../types";
import { settleNewStar, getDropX, getRandomR } from "../lib/physics";
import { MoodEntryModal } from "./MoodEntryModal";
import { StarJarCalendar } from "./StarJarCalendar";
import { StarJarView } from "./StarJarView";

interface Props {
  entries: MoodEntry[];
  onUpsert: (entry: MoodEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MAX_STARS = 30;

function computeStreak(entries: MoodEntry[]): number {
  const dateSet = new Set<string>();
  entries.forEach((e) => dateSet.add(e.date));

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  if (!dateSet.has(today) && !dateSet.has(yesterday)) return 0;

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (dateSet.has(d)) {
      streak++;
    } else if (i === 0) {
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

  function getExistingPositions(): { x: number; y: number; r: number }[] {
    return entries
      .filter((e) => e.position)
      .map((e) => e.position!)
      .map((p) => ({ x: p.x, y: p.y, r: p.r }));
  }

  async function handleAddOne(content: string) {
    // FIFO: clear oldest star position if at capacity (keep mood record)
    const entriesWithStar = entries.filter((e) => e.position);
    if (entriesWithStar.length >= MAX_STARS) {
      const oldest = [...entriesWithStar].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      await onUpsert({ ...oldest, position: undefined, updatedAt: new Date().toISOString() });
    }

    const now = new Date().toISOString();
    const existing = getExistingPositions();
    const r = getRandomR();
    const dropX = getDropX();
    const position = settleNewStar({ x: dropX, r }, existing);

    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      date: todayStr,
      content,
      position,
      createdAt: now,
      updatedAt: now
    };
    await onUpsert(entry);
  }

  async function handleReset() {
    const ids = entries.map((e) => e.id);
    for (const id of ids) {
      await onDelete(id);
    }
  }

  async function handleClearJar() {
    // Clear only visible star positions — keep all mood records & counts intact
    const entriesWithPos = entries.filter((e) => e.position);
    for (const entry of entriesWithPos) {
      await onUpsert({ ...entry, position: undefined, updatedAt: new Date().toISOString() });
    }
  }

  return (
    <div className="pt-4 sm:pt-8 pb-12">
      {view === "jar" ? (
        <StarJarView
          entries={entries}
          todayCount={todayCount}
          streak={streak}
          onViewCalendar={() => setView("calendar")}
          onAddOne={handleAddOne}
          onReset={handleReset}
          onClearJar={handleClearJar}
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
