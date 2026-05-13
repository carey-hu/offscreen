export type FocusMode = "pomodoro" | "long" | "countdown" | "stopwatch";
export type FocusStatus = "running" | "paused" | "completed" | "abandoned";

export interface FocusSession {
  id: string;
  deviceId: string;
  taskId?: string;
  title: string;
  tag: string;
  mode: FocusMode;
  startTime: string;
  endTime?: string;
  plannedMinutes: number;
  actualMinutes: number;
  status: FocusStatus;
  focusScore?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
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

export interface TaskNote {
  id: string;
  taskId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StarPosition {
  x: number;
  y: number;
  r: number;
  rot: number;
}

export interface MoodEntry {
  id: string;
  date: string;
  content: string;
  position?: StarPosition;
  createdAt: string;
  updatedAt: string;
}
