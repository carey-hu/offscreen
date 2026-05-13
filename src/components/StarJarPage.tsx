import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { MoodEntry } from "../types";
import { settleNewStar, getDropX, getRandomR, PhysicsStar } from "../lib/physics";
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

  function getExistingPositions(): PhysicsStar[] {
    return entries
      .filter((e) => e.position)
      .map((e) => e.position!)
      .map((p) => ({ x: p.x, y: p.y, r: p.r, rot: p.rot }));
  }

  async function handleAddOne(content: string) {
    // FIFO: remove oldest if at capacity
    if (entries.length >= MAX_STARS) {
      const oldest = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      await onDelete(oldest.id);
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
