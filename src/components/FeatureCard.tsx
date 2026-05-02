import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { Feature, Task } from "../types/index";
import { getAccentColor } from "../utils/pipelineHelpers";

const FEATURE_NAME_MAX_LENGTH = 40;
const TASK_TITLE_MAX_LENGTH = 90;

interface FeatureCardProps {
  feature: Feature;
  role: "pm" | "dev-fe" | "dev-be";
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDragHandlePointerDown: (e: React.PointerEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  // PM actions
  onEditFeature?: (featureId: number, newName: string) => void;
  onDeleteFeature?: (featureId: number) => void;
  onAddTask?: (featureId: number, taskTitle: string) => void;
  onEditTask?: (featureId: number, taskId: string, newTitle: string) => void;
  onDeleteTask?: (featureId: number, taskId: string) => void;
  onTogglePmTaskConfirm?: (featureId: number, taskId: string) => void;
  // Dev actions
  onToggleDevTaskCheck?: (featureId: number, taskId: string) => void;
  onPublishTaskToGithubIssue?: (featureId: number, taskId: string) => void;
  onCreateTaskProposal?: (featureId: number, proposedValue: string) => void;
  onOpenProposalPanel?: () => void;
}

const calculateProgress = (tasks: Task[]) => {
  if (tasks.length === 0) return { dev: 0, pm: 0 };
  return {
    dev: Math.round((tasks.filter((t) => t.devChecked).length / tasks.length) * 100),
    pm: Math.round((tasks.filter((t) => t.pmConfirmed).length / tasks.length) * 100),
  };
};

export default function FeatureCard({
  feature,
  role,
  isExpanded,
  onToggleExpand,
  onDragHandlePointerDown,
  isDragging = false,
  isDragOver = false,
  onEditFeature,
  onDeleteFeature,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTogglePmTaskConfirm,
  onToggleDevTaskCheck,
  onPublishTaskToGithubIssue,
  onCreateTaskProposal,
  onOpenProposalPanel,
}: FeatureCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(feature.name);
  const [taskDraft, setTaskDraft] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");

  const isPm = role === "pm";
  const accentColor = getAccentColor(feature.id);
  const progress = calculateProgress(feature.tasks);

  const handleSaveFeatureName = () => {
    const trimmed = editNameValue.trim().slice(0, FEATURE_NAME_MAX_LENGTH);
    if (!trimmed || trimmed === feature.name) {
      setIsEditingName(false);
      setEditNameValue(feature.name);
      return;
    }
    onEditFeature?.(feature.id, trimmed);
    setIsEditingName(false);
  };

  const handleAddTask = () => {
    const trimmed = taskDraft.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) return;
    onAddTask?.(feature.id, trimmed);
    setTaskDraft("");
    onOpenProposalPanel?.();
  };

  const handleSaveTaskEdit = (taskId: string) => {
    const trimmed = editingTaskValue.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) { setEditingTaskId(null); return; }
    const task = feature.tasks.find((t) => t.id === taskId);
    if (!task || task.title === trimmed) { setEditingTaskId(null); return; }
    onEditTask?.(feature.id, taskId, trimmed);
    setEditingTaskId(null);
  };

  const handleCreateTaskProposal = () => {
    const trimmed = taskDraft.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) return;
    onCreateTaskProposal?.(feature.id, trimmed);
    setTaskDraft("");
    onOpenProposalPanel?.();
  };

  return (
    <div
      className={`absolute bg-white rounded-xl border transition-all select-none ${
        isDragging ? "opacity-40 scale-95" : "opacity-100"
      } ${isDragOver ? "ring-2 ring-[#6366F1] border-[#6366F1]" : "border-[#E5E5E5]"}`}
      style={{
        width: 260,
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.12)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-[#C4C4C4] hover:text-[#9E9E9E] transition-colors touch-none"
            onPointerDown={onDragHandlePointerDown}
            aria-label="드래그해서 이동"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Feature name */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <input
                value={editNameValue}
                maxLength={FEATURE_NAME_MAX_LENGTH}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={handleSaveFeatureName}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSaveFeatureName();
                  if (e.key === "Escape") { setIsEditingName(false); setEditNameValue(feature.name); }
                }}
                autoFocus
                className="w-full rounded-md border border-[#E5E5E5] px-2 py-1 text-sm font-semibold text-gray-900 focus:border-[#6366F1] focus:outline-none"
              />
            ) : (
              <button
                onClick={onToggleExpand}
                className="w-full text-left"
              >
                <h4 className="text-sm font-semibold text-gray-900 break-words leading-snug">{feature.name}</h4>
              </button>
            )}
          </div>

          {/* Expand toggle */}
          <button
            onClick={onToggleExpand}
            className="shrink-0 text-[#9E9E9E] hover:text-gray-700 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress.dev}%`, backgroundColor: accentColor }}
            />
          </div>
          <span className="text-[10px] text-[#9E9E9E] shrink-0">
            DEV {progress.dev}% · PM {progress.pm}%
          </span>
        </div>

        {/* PM actions */}
        {isPm && !isEditingName && (
          <div className="mt-2 flex items-center justify-end gap-1">
            <button
              onClick={() => { setIsEditingName(true); setEditNameValue(feature.name); }}
              className="rounded p-1 text-[#C4C4C4] hover:text-gray-700 hover:bg-[#F5F5F5] transition-colors"
              title="기능 이름 수정 제안"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeleteFeature?.(feature.id)}
              className="rounded p-1 text-[#C4C4C4] hover:text-red-500 hover:bg-[#F5F5F5] transition-colors"
              title="기능 삭제 제안"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Task list */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-1.5">
          <div className="h-px bg-[#F0F0F0] mb-2" />

          {feature.tasks.length === 0 && (
            <p className="text-xs text-[#C4C4C4] py-1">등록된 세부작업이 없습니다.</p>
          )}

          {feature.tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg bg-[#FAFAFA] border border-[#F0F0F0] px-3 py-2"
            >
              {editingTaskId === task.id ? (
                <div className="flex gap-1.5">
                  <input
                    value={editingTaskValue}
                    maxLength={TASK_TITLE_MAX_LENGTH}
                    onChange={(e) => setEditingTaskValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSaveTaskEdit(task.id);
                      if (e.key === "Escape") setEditingTaskId(null);
                    }}
                    autoFocus
                    className="flex-1 rounded border border-[#E5E5E5] px-2 py-1 text-xs focus:border-[#6366F1] focus:outline-none"
                  />
                  <button onClick={() => handleSaveTaskEdit(task.id)} className="rounded bg-gray-900 px-2 text-[11px] text-white">제안</button>
                  <button onClick={() => setEditingTaskId(null)} className="rounded border border-[#E5E5E5] px-2 text-[11px] text-gray-500">취소</button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 break-words leading-snug">{task.title}</p>
                    {isPm ? (
                      <p className="text-[10px] text-[#9E9E9E] mt-0.5">
                        {task.devChecked ? "DEV 체크 완료" : "DEV 체크 대기"}
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#9E9E9E] mt-0.5">
                        {task.pmConfirmed ? "PM 확인 완료" : "PM 확인 대기"}
                      </p>
                    )}
                  </div>

                  {isPm ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="checkbox"
                        checked={task.pmConfirmed}
                        disabled={!task.devChecked}
                        onChange={() => onTogglePmTaskConfirm?.(feature.id, task.id)}
                        className="accent-[#6366F1]"
                        title={task.devChecked ? "PM 확인" : "DEV 체크 후 PM 확인 가능"}
                      />
                      <button
                        onClick={() => { setEditingTaskId(task.id); setEditingTaskValue(task.title); }}
                        className="rounded p-0.5 text-[#C4C4C4] hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDeleteTask?.(feature.id, task.id)}
                        className="rounded p-0.5 text-[#C4C4C4] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {onPublishTaskToGithubIssue && (
                        <button
                          onClick={() => onPublishTaskToGithubIssue(feature.id, task.id)}
                          className="rounded border border-[#E5E5E5] px-1.5 py-0.5 text-[10px] text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
                        >
                          GitHub
                        </button>
                      )}
                      <input
                        type="checkbox"
                        checked={task.devChecked}
                        onChange={() => onToggleDevTaskCheck?.(feature.id, task.id)}
                        className="accent-[#6366F1]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add task input */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              value={taskDraft}
              maxLength={TASK_TITLE_MAX_LENGTH}
              onChange={(e) => setTaskDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                if (isPm) handleAddTask();
                else handleCreateTaskProposal();
              }}
              placeholder="세부작업 추가 제안"
              className="flex-1 rounded-lg border border-[#E5E5E5] px-2.5 py-1.5 text-xs focus:border-[#6366F1] focus:outline-none placeholder:text-[#C4C4C4]"
            />
            <button
              onClick={isPm ? handleAddTask : handleCreateTaskProposal}
              className="rounded-lg bg-gray-900 p-1.5 text-white hover:bg-gray-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
