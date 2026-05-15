import { format, parseISO } from "date-fns";
import { MoodEntry } from "../types";

const POSITIVE = [
  "开心", "快乐", "幸福", "满足", "感恩", "充实", "好", "棒",
  "喜欢", "爱", "感谢", "进步", "成功", "期待", "温暖",
  "轻松", "自在", "兴奋", "激动", "美好", "治愈", "放松",
  "享受", "成就", "正能量", "惊喜", "感动", "美好", "顺利",
  "收获", "突破", "值得", "微笑", "笑", "赞", "优秀"
];

const NEGATIVE = [
  "累", "疲惫", "难过", "伤心", "焦虑", "烦躁", "压力",
  "困", "无聊", "失望", "生气", "沮丧", "迷茫", "孤独",
  "紧张", "不安", "痛苦", "烦", "崩溃", "丧", "难",
  "失败", "糟糕", "讨厌", "烦人", "不舒服", "伤心"
];

export function generateMoodSummary(entries: MoodEntry[], _date: string): string {
  const count = entries.length;
  if (count === 0) return "";

  const times = entries
    .map((e) => parseISO(e.createdAt).getTime())
    .sort((a, b) => a - b);
  const first = format(times[0], "HH:mm");
  const last = format(times[times.length - 1], "HH:mm");

  const allText = entries.map((e) => e.content).join(" ");
  let pos = 0;
  let neg = 0;
  POSITIVE.forEach((w) => {
    const m = allText.match(new RegExp(w, "g"));
    if (m) pos += m.length;
  });
  NEGATIVE.forEach((w) => {
    const m = allText.match(new RegExp(w, "g"));
    if (m) neg += m.length;
  });

  const hours = entries.map((e) => parseISO(e.createdAt).getHours());
  const hasMorning = hours.some((h) => h < 10);
  const hasLateNight = hours.some((h) => h >= 23);

  const parts: string[] = [];

  if (count === 1) parts.push("今天你记录了一次心情");
  else if (count <= 3) parts.push(`今天你记录了${count}次心情，数量适中`);
  else if (count <= 6) parts.push(`今天你记录了${count}次心情，相当丰富`);
  else parts.push(`今天你记录了${count}次心情，内心一定很活跃`);

  if (first === last) {
    parts.push(`在${first}留下了这份记录`);
  } else {
    parts.push(`时间从${first}到${last}`);
  }

  if (hasMorning && !hasLateNight) parts.push("早起就开始记录，是个不错的习惯");
  if (hasLateNight) parts.push("深夜还在记录，记得好好休息哦");

  if (pos > neg * 2) {
    parts.push("整体情绪积极明亮，充满正能量，继续保持这份好心情");
  } else if (pos > neg) {
    parts.push("整体以积极情绪为主，偶尔有些小波动，这也是生活的常态");
  } else if (neg > pos * 2) {
    parts.push("今天似乎有些挑战，记录本身就是一种治愈，每一天都值得被温柔对待");
  } else if (neg > pos) {
    parts.push("今天有些起伏，记得给自己一些温柔和理解");
  } else if (pos === 0 && neg === 0) {
    parts.push("今天的记录比较中性，有时候平静本身就是一种力量");
  } else {
    parts.push("心情有好有坏，起起伏伏，这就是真实的你");
  }

  return parts.join("。") + "。";
}
