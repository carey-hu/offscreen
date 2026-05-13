export type FocusMode = "pomodoro" | "long" | "countdown" | "stopwatch" | "flip";
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
  focusScore?: number;
  whiteNoiseId?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface WhiteNoiseTrack {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  icon: string;
  description: string;
  tag: string;
  plannedMinutes?: number;
}

export interface UserSettings {
  defaultMode: FocusMode;
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longFocusMinutes: number;
  theme: "system" | "light" | "dark";
  notificationEnabled: boolean;
}
