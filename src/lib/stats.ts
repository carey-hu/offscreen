import { FocusSession } from "../types";
import { format, isSameDay, isSameWeek, parseISO, subDays } from "date-fns";

export function completedSessions(sessions: FocusSession[]) {
  return sessions.filter((s) => s.status === "completed");
}

export function totalMinutes(sessions: FocusSession[]) {
  return completedSessions(sessions).reduce((sum, s) => sum + s.actualMinutes, 0);
}

export function todaySessions(sessions: FocusSession[]) {
  const now = new Date();
  return sessions.filter((s) => isSameDay(parseISO(s.startTime), now));
}

export function weekSessions(sessions: FocusSession[]) {
  const now = new Date();
  return sessions.filter((s) => isSameWeek(parseISO(s.startTime), now, { weekStartsOn: 1 }));
}

export function tagStats(sessions: FocusSession[]) {
  const map = new Map<string, number>();

  completedSessions(sessions).forEach((s) => {
    map.set(s.tag, (map.get(s.tag) ?? 0) + s.actualMinutes);
  });

  return Array.from(map.entries())
    .map(([tag, minutes]) => ({ tag, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function lastSevenDays(sessions: FocusSession[]) {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    return {
      date,
      label: format(date, "MM-dd"),
      minutes: 0
    };
  });

  completedSessions(sessions).forEach((session) => {
    const date = parseISO(session.startTime);
    const item = days.find((day) => isSameDay(day.date, date));
    if (item) item.minutes += session.actualMinutes;
  });

  return days.map(({ label, minutes }) => ({ label, minutes }));
}

export function currentStreakDays(sessions: FocusSession[]) {
  const completed = completedSessions(sessions);
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = subDays(new Date(), i);
    const hasSession = completed.some((s) => isSameDay(parseISO(s.startTime), date));
    if (hasSession) streak += 1;
    else if (i === 0) continue;
    else break;
  }

  return streak;
}
