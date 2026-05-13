import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { MoodEntry } from "../types";
import { generateMoodSummary } from "../lib/moodSummary";
import { settleNewStar, getDropX, getRandomR } from "../lib/physics";
import { StarPosition } from "../types";

interface Props {
  open: boolean;
  date: string;
  entries: MoodEntry[];
  onClose: () => void;
  onUpsert: (entry: MoodEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type Brightness = "none" | "dim" | "medium" | "bright";

function getBrightness(count: number): { level: Brightness; opacity: number; glow: number } {
  if (count === 0) return { level: "none", opacity: 0.15, glow: 0.05 };
  if (count <= 2) return { level: "dim", opacity: 0.35, glow: 0.15 };
  if (count <= 5) return { level: "medium", opacity: 0.65, glow: 0.35 };
  return { level: "bright", opacity: 1, glow: 0.6 };
}

function starEmoji(count: number): string {
  if (count === 0) return "✨";
  if (count <= 2) return "⭐";
  if (count <= 5) return "🌟";
  return "💫";
}

export function MoodEntryModal({ open, date, entries, onClose, onUpsert, onDelete }: Props) {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!open) return null;

  const b = getBrightness(entries.length);
  const summary = generateMoodSummary(entries, date);
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function handleAdd() {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const existingPositions: StarPosition[] = entries
      .filter((e) => e.position)
      .map((e) => e.position!);
    const r = getRandomR();
    const dropX = getDropX();
    const position = settleNewStar({ x: dropX, r }, existingPositions);
    await onUpsert({
      id: crypto.randomUUID(),
      date,
      content: content.trim(),
      position,
      createdAt: now,
      updatedAt: now
    });
    setContent("");
  }

  async function handleSaveEdit(entry: MoodEntry) {
    await onUpsert({ ...entry, content: editContent.trim(), updatedAt: new Date().toISOString() });
    setEditingId(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-[2rem] bg-card p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              心情记录
            </p>
            <h3 className="mt-0.5 text-lg sm:text-xl font-black text-primary">
              {format(parseISO(date), "yyyy年M月d日 EEEE", { locale: zhCN })}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted hover:text-primary shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Brightness indicator + count */}
        <div
          className="flex items-center gap-3 rounded-2xl p-4 mb-4"
          style={{ background: `rgba(251,191,36,${b.glow * 0.15})` }}
        >
          <span
            className="text-2xl"
            style={{
              opacity: b.opacity,
              filter: b.glow > 0.2 ? `drop-shadow(0 0 ${b.glow * 30}px var(--star-glow))` : undefined
            }}
          >
            {starEmoji(entries.length)}
          </span>
          <div>
            <p className="text-sm font-black text-primary">
              {entries.length === 0
                ? "今天还没有星星"
                : `${entries.length} 条心情记录`}
            </p>
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {b.level === "none" && "写点什么吧，让今天的星星亮起来"}
              {b.level === "dim" && "星星微亮，再写几条更亮哦"}
              {b.level === "medium" && "星星明亮，心情不错"}
              {b.level === "bright" && "星光璀璨，满满的好心情"}
            </p>
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <details className="mb-4 group">
            <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition">
              <Sparkles size={12} />
              <span>AI 感悟</span>
            </summary>
            <p className="mt-2 pl-5 text-sm leading-relaxed text-secondary">
              {summary}
            </p>
          </details>
        )}

        {/* Add entry */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天哪件事让你感到特别开心、满足或成就感？"
            rows={3}
            className="w-full min-h-[80px] rounded-xl bg-surface p-3 text-sm leading-relaxed text-primary outline-none resize-y focus:ring-2 focus:ring-amber-400/50 placeholder:text-faint"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-40"
              style={{
                background: "var(--star-bright)",
                color: "#1c1c1e"
              }}
            >
              <Plus size={14} />
              添加
            </button>
          </div>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          {sorted.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-faint">
              这一天还没有记录
            </div>
          ) : (
            sorted.map((entry) => (
              <div
                key={entry.id}
                className="group rounded-2xl bg-page p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-muted">
                    {format(parseISO(entry.createdAt), "HH:mm")}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditContent(entry.content);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-primary"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("删除这条记录？")) onDelete(entry.id);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-red-500/15 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {editingId === entry.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full rounded-xl bg-surface p-2 text-sm leading-relaxed text-primary outline-none resize-y focus:ring-2 focus:ring-amber-400/50"
                      rows={2}
                    />
                    <div className="mt-1 flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-full px-3 py-1 text-[10px] font-bold text-muted hover:text-primary"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSaveEdit(entry)}
                        disabled={!editContent.trim()}
                        className="rounded-full px-3 py-1 text-[10px] font-bold disabled:opacity-40"
                        style={{ color: "var(--star-bright)" }}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-secondary whitespace-pre-wrap break-words">
                    {entry.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
