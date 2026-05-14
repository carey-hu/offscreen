import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowUp, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { MoodEntry } from "../types";
import { generateMoodSummary } from "../lib/moodSummary";
import { settleNewStar, getDropX, getRandomR } from "../lib/physics";
import { makeRoundedStarPath } from "../lib/starPath";
import { StarPosition } from "../types";

interface Props {
  open: boolean;
  date: string;
  entries: MoodEntry[];
  onClose: () => void;
  onUpsert: (entry: MoodEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface Brightness {
  scale: number;
  opacity: number;
  glow: number;
  label: string;
  hint: string;
}

function brightnessOf(count: number): Brightness {
  if (count === 0) return { scale: 0.55, opacity: 0.25, glow: 0, label: "今天还没有星星", hint: "写点什么吧，让今天的星星亮起来" };
  if (count <= 2) return { scale: 0.7, opacity: 0.6, glow: 2, label: `${count} 条心情记录`, hint: "星星微亮，再写几条更亮哦" };
  if (count <= 5) return { scale: 0.85, opacity: 0.85, glow: 5, label: `${count} 条心情记录`, hint: "星星明亮，心情不错" };
  return { scale: 1, opacity: 1, glow: 9, label: `${count} 条心情记录`, hint: "星光璀璨，满满的好心情" };
}

export function MoodEntryModal({ open, date, entries, onClose, onUpsert, onDelete }: Props) {
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  if (!open) return null;

  const b = brightnessOf(entries.length);
  const summary = generateMoodSummary(entries, date);
  const sorted = [...entries].sort((a, c) => c.createdAt.localeCompare(a.createdAt));

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
      style={{ animation: "sjFadeUp 0.25s ease-out" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-[1.75rem] sm:rounded-[1.75rem] overflow-hidden"
        style={{
          background: "var(--bg-card)",
          boxShadow: "var(--sj-shadow-float)",
          border: "1px solid var(--sj-card-border)",
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="h-1 w-9 rounded-full" style={{ background: "var(--sj-divider)" }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              心情记录
            </p>
            <h3 className="mt-1 text-[20px] font-bold text-primary tracking-tight leading-tight">
              {format(parseISO(date), "M月d日 EEEE", { locale: zhCN })}
            </h3>
            <p className="text-[12px] font-medium text-faint mt-0.5">
              {format(parseISO(date), "yyyy年", { locale: zhCN })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-primary transition-colors shrink-0"
            style={{ background: "var(--bg-surface)" }}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        {/* Brightness card */}
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{ background: "var(--sj-pill-bg)" }}
          >
            <div
              className="grid h-10 w-10 place-items-center shrink-0"
              style={{
                filter: b.glow > 0 ? `drop-shadow(0 0 ${b.glow}px var(--star-glow))` : undefined,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 20 20" style={{
                opacity: b.opacity,
                transform: `scale(${b.scale})`,
              }}>
                <path d={makeRoundedStarPath(10, 10, 9, 0)} fill="var(--star-bright)" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-primary leading-tight">
                {b.label}
              </p>
              <p className="text-[12px] font-medium text-muted mt-0.5">
                {b.hint}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <div className="px-6 pb-3">
            <details className="group">
              <summary
                className="flex items-center gap-1.5 cursor-pointer text-[12px] font-semibold transition-colors"
                style={{ color: "var(--star-bright)" }}
              >
                <Sparkles size={13} strokeWidth={2.25} />
                <span>AI 感悟</span>
                <span className="ml-auto text-[11px] font-medium text-muted group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-2.5 text-[13px] leading-relaxed text-secondary">
                {summary}
              </p>
            </details>
          </div>
        )}

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6">
          {sorted.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] font-medium text-faint">
                这一天还没有记录
              </p>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--sj-divider)" }}>
              {sorted.map((entry) => (
                <li key={entry.id} className="group py-3" style={{ borderColor: "var(--sj-divider)" }}>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold tabular-nums text-muted">
                      {format(parseISO(entry.createdAt), "HH:mm")}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditContent(entry.content);
                        }}
                        aria-label="编辑"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-primary transition-colors"
                      >
                        <Pencil size={12} strokeWidth={2.25} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("删除这条记录？")) onDelete(entry.id);
                        }}
                        aria-label="删除"
                        className="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} strokeWidth={2.25} />
                      </button>
                    </div>
                  </div>
                  {editingId === entry.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        rows={2}
                        className="sj-input w-full rounded-xl px-3 py-2 text-[13px] leading-relaxed text-primary outline-none resize-y"
                      />
                      <div className="mt-1.5 flex gap-1 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted hover:text-primary transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleSaveEdit(entry)}
                          disabled={!editContent.trim()}
                          className="rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-40"
                          style={{ color: "var(--star-bright)" }}
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[14px] leading-relaxed text-secondary whitespace-pre-wrap break-words">
                      {entry.content}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Input bar */}
        <div
          className="px-6 py-3 border-t"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--sj-divider)",
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="今天有什么开心的事？"
              rows={1}
              className="sj-input flex-1 rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed text-primary outline-none resize-none placeholder:text-faint/70 min-h-[42px] max-h-[120px]"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              aria-label="添加心情"
              className="grid h-[42px] w-[42px] place-items-center rounded-full transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              style={{
                background: content.trim()
                  ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)"
                  : "var(--bg-surface)",
                color: content.trim() ? "#1c1c1e" : "var(--text-muted)",
                boxShadow: content.trim()
                  ? "0 4px 12px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.3)"
                  : "none",
              }}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
