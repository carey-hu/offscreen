export type FocusMode = "pomodoro" | "long" | "countdown" | "stopwatch";
export type FocusStatus = "running" | "paused" | "completed" | "abandoned";

export interface FocusSession {
  id: string;
  deviceId: string;
  title: string;
  tag: string;
  mode: FocusMode;
  startTime: string;
  endTime?: string;
  plannedMinutes: number;
  actualMinutes: number;
  status: FocusStatus;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface UserSettings {
  defaultMode: FocusMode;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longFocusMinutes: number;
  theme: "system" | "light" | "dark";
  notificationEnabled: boolean;
}
