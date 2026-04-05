import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
  GripVertical,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { Feature, FeatureQuestion, Task } from "../../types/index";

interface PMDashboardProps {
  section: "ai" | "pipeline" | "review";
  features: Feature[];
  setFeatures: React.Dispatch<React.SetStateAction<Feature[]>>;
  featureQuestions: FeatureQuestion[];
  onCreateFeatureQuestion: (payload: {
    featureId: number;
    taskId?: string;
    content: string;
  }) => void;
  onAddQuestionMessage: (questionId: string, content: string) => void;
  onUpdateQuestionMessage: (
    questionId: string,
    messageId: string,
    content: string,
  ) => void;
  onDeleteQuestionMessage: (questionId: string, messageId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onConfirmQuestionByPm: (questionId: string) => void;
  onCancelQuestionConfirmByPm: (questionId: string) => void;
  onTogglePmTaskConfirm: (featureId: number, taskId: string) => void;
  onMoveSection: (section: "pm-ai" | "pm-pipeline" | "pm-review") => void;
}

const makeTaskId = (featureId: number) => `${featureId}-${Date.now()}`;
const FEATURE_NAME_MAX_LENGTH = 40;
const TASK_TITLE_MAX_LENGTH = 90;
const QUESTION_TEXT_MAX_LENGTH = 280;
const TIMELINE_MESSAGE_MAX_LENGTH = 220;

export default function PMDashboard({
  section,
  features,
  setFeatures,
  featureQuestions,
  onCreateFeatureQuestion,
  onAddQuestionMessage,
  onUpdateQuestionMessage,
  onDeleteQuestionMessage,
  onDeleteQuestion,
  onConfirmQuestionByPm,
  onCancelQuestionConfirmByPm,
  onTogglePmTaskConfirm,
  onMoveSection,
}: PMDashboardProps) {
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<number[]>(
    features[0] ? [features[0].id] : [],
  );
  const [newFeatureName, setNewFeatureName] = useState("");
  const [editingFeatureId, setEditingFeatureId] = useState<number | null>(null);
  const [editingFeatureName, setEditingFeatureName] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<number, string>>({});
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [pickerFeatureId, setPickerFeatureId] = useState("");
  const [pickerTaskId, setPickerTaskId] = useState("");
  const [questionInput, setQuestionInput] = useState("");

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [newMessageInput, setNewMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageInput, setEditingMessageInput] = useState("");
  const [draggingFeatureId, setDraggingFeatureId] = useState<number | null>(
    null,
  );
  const [dragOverFeatureId, setDragOverFeatureId] = useState<number | null>(
    null,
  );
  const [draggingTask, setDraggingTask] = useState<{
    featureId: number;
    taskId: string;
  } | null>(null);
  const [dragOverTaskKey, setDragOverTaskKey] = useState<string | null>(null);

  const activeQuestions = useMemo(
    () => featureQuestions.filter((question) => !question.closed),
    [featureQuestions],
  );

  const selectedQuestion = useMemo(() => {
    if (activeQuestions.length === 0) return null;
    if (!selectedQuestionId) return activeQuestions[0];
    return (
      activeQuestions.find((question) => question.id === selectedQuestionId) ??
      activeQuestions[0]
    );
  }, [activeQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) {
      setSelectedQuestionId(null);
      return;
    }
    if (selectedQuestionId !== selectedQuestion.id) {
      setSelectedQuestionId(selectedQuestion.id);
    }
  }, [selectedQuestion, selectedQuestionId]);

  const toggleFeatureExpand = (featureId: number) => {
    setExpandedFeatureIds((prev) =>
      prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId],
    );
  };

  const reorderFeatures = (dragFeatureId: number, targetFeatureId: number) => {
    setFeatures((prev) => {
      const dragIndex = prev.findIndex(
        (feature) => feature.id === dragFeatureId,
      );
      const targetIndex = prev.findIndex(
        (feature) => feature.id === targetFeatureId,
      );
      if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) {
        return prev;
      }

      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const reorderTasks = (
    featureId: number,
    dragTaskId: string,
    targetTaskId: string,
  ) => {
    setFeatures((prev) =>
      prev.map((feature) => {
        if (feature.id !== featureId) return feature;

        const dragIndex = feature.tasks.findIndex(
          (task) => task.id === dragTaskId,
        );
        const targetIndex = feature.tasks.findIndex(
          (task) => task.id === targetTaskId,
        );
        if (
          dragIndex === -1 ||
          targetIndex === -1 ||
          dragIndex === targetIndex
        ) {
          return feature;
        }

        const nextTasks = [...feature.tasks];
        const [movedTask] = nextTasks.splice(dragIndex, 1);
        nextTasks.splice(targetIndex, 0, movedTask);

        return {
          ...feature,
          tasks: nextTasks,
        };
      }),
    );
  };

  const createFeature = () => {
    const trimmed = newFeatureName.trim().slice(0, FEATURE_NAME_MAX_LENGTH);
    if (!trimmed) return;

    const nextId =
      features.length === 0
        ? 1
        : Math.max(...features.map((feature) => feature.id)) + 1;
    setFeatures((prev) => [
      ...prev,
      {
        id: nextId,
        name: trimmed,
        tasks: [],
      },
    ]);
    setExpandedFeatureIds((prev) => [...prev, nextId]);
    setNewFeatureName("");
  };

  const startEditFeature = (feature: Feature) => {
    setEditingFeatureId(feature.id);
    setEditingFeatureName(feature.name);
  };

  const saveFeatureEdit = () => {
    if (editingFeatureId === null) return;
    const trimmed = editingFeatureName.trim().slice(0, FEATURE_NAME_MAX_LENGTH);
    if (!trimmed) return;

    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === editingFeatureId
          ? { ...feature, name: trimmed }
          : feature,
      ),
    );
    setEditingFeatureId(null);
    setEditingFeatureName("");
  };

  const deleteFeature = (featureId: number) => {
    setFeatures((prev) => prev.filter((feature) => feature.id !== featureId));
    setExpandedFeatureIds((prev) => prev.filter((id) => id !== featureId));
    if (selectedFeatureId === String(featureId)) {
      setSelectedFeatureId("");
      setSelectedTaskId("");
    }
  };

  const addTask = (featureId: number) => {
    const draft = (taskDrafts[featureId] ?? "")
      .trim()
      .slice(0, TASK_TITLE_MAX_LENGTH);
    if (!draft) return;

    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              tasks: [
                ...feature.tasks,
                {
                  id: makeTaskId(featureId),
                  title: draft,
                  devChecked: false,
                  pmConfirmed: false,
                },
              ],
            }
          : feature,
      ),
    );

    setTaskDrafts((prev) => ({ ...prev, [featureId]: "" }));
  };

  const getTaskEditKey = (featureId: number, taskId: string) =>
    `${featureId}:${taskId}`;

  const startEditTask = (featureId: number, task: Task) => {
    setEditingTaskKey(getTaskEditKey(featureId, task.id));
    setEditingTaskTitle(task.title);
  };

  const cancelTaskEdit = () => {
    setEditingTaskKey(null);
    setEditingTaskTitle("");
  };

  const saveTaskEdit = (featureId: number, taskId: string) => {
    const trimmed = editingTaskTitle.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) return;

    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              tasks: feature.tasks.map((task) =>
                task.id === taskId ? { ...task, title: trimmed } : task,
              ),
            }
          : feature,
      ),
    );

    cancelTaskEdit();
  };

  const deleteTask = (featureId: number, taskId: string) => {
    setFeatures((prev) =>
      prev.map((feature) =>
        feature.id === featureId
          ? {
              ...feature,
              tasks: feature.tasks.filter((task) => task.id !== taskId),
            }
          : feature,
      ),
    );

    if (selectedTaskId === taskId) setSelectedTaskId("");
    if (pickerTaskId === taskId) setPickerTaskId("");
    if (editingTaskKey === getTaskEditKey(featureId, taskId)) {
      cancelTaskEdit();
    }
  };

  const selectedFeature = features.find(
    (feature) => String(feature.id) === selectedFeatureId,
  );
  const selectedTask = selectedFeature?.tasks.find(
    (task) => task.id === selectedTaskId,
  );

  const openPicker = () => {
    setPickerFeatureId(selectedFeatureId || String(features[0]?.id ?? ""));
    setPickerTaskId(selectedTaskId);
    setIsPickerOpen(true);
  };

  const confirmPicker = () => {
    setSelectedFeatureId(pickerFeatureId);
    setSelectedTaskId(pickerTaskId);
    setIsPickerOpen(false);
  };

  const submitQuestion = () => {
    const featureIdNumber = Number(selectedFeatureId);
    const trimmedQuestion = questionInput
      .trim()
      .slice(0, QUESTION_TEXT_MAX_LENGTH);
    if (!featureIdNumber || !trimmedQuestion) return;

    onCreateFeatureQuestion({
      featureId: featureIdNumber,
      taskId: selectedTaskId || undefined,
      content: trimmedQuestion,
    });
    setQuestionInput("");
    onMoveSection("pm-review");
  };

  const submitNewMessage = () => {
    const trimmedMessage = newMessageInput
      .trim()
      .slice(0, TIMELINE_MESSAGE_MAX_LENGTH);
    if (!selectedQuestion || !trimmedMessage) return;
    onAddQuestionMessage(selectedQuestion.id, trimmedMessage);
    setNewMessageInput("");
  };

  const startEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageInput(content);
  };

  const saveEditedMessage = () => {
    const trimmedMessage = editingMessageInput
      .trim()
      .slice(0, TIMELINE_MESSAGE_MAX_LENGTH);
    if (!selectedQuestion || !editingMessageId || !trimmedMessage) return;
    onUpdateQuestionMessage(
      selectedQuestion.id,
      editingMessageId,
      trimmedMessage,
    );
    setEditingMessageId(null);
    setEditingMessageInput("");
  };

  const removeMessage = (messageId: string) => {
    if (!selectedQuestion) return;
    onDeleteQuestionMessage(selectedQuestion.id, messageId);
    if (editingMessageId === messageId) {
      setEditingMessageId(null);
      setEditingMessageInput("");
    }
  };

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) {
      return { dev: 0, pm: 0 };
    }

    const devCheckedCount = tasks.filter((task) => task.devChecked).length;
    const pmConfirmedCount = tasks.filter((task) => task.pmConfirmed).length;

    return {
      dev: Math.round((devCheckedCount / tasks.length) * 100),
      pm: Math.round((pmConfirmedCount / tasks.length) * 100),
    };
  };

  const totalProgress =
    features.length === 0
      ? 0
      : Math.round(
          features.reduce(
            (acc, feature) => acc + calculateProgress(feature.tasks).pm,
            0,
          ) / features.length,
        );

  if (section === "ai") {
    return (
      <>
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px]">
          <div className="max-w-3xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                기능 질문 전달
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                파이프라인 다이얼로그에서 기능/세부작업을 선택한 뒤 질문을
                보냅니다.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <button
                onClick={openPicker}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <GitPullRequest className="h-4 w-4" /> 파이프라인 선택
                다이얼로그 열기
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-indigo-100 bg-white p-3">
                  <p className="text-xs font-semibold text-indigo-900">
                    선택된 기능
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedFeature?.name ?? "기능을 선택하세요"}
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-100 bg-white p-3">
                  <p className="text-xs font-semibold text-indigo-900">
                    선택된 세부작업
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedTask?.title ?? "기능 전체"}
                  </p>
                </div>
              </div>

              <label className="block text-xs font-semibold text-indigo-900">
                개발자에게 전달할 질문
              </label>
              <textarea
                value={questionInput}
                maxLength={QUESTION_TEXT_MAX_LENGTH}
                onChange={(event) => setQuestionInput(event.target.value)}
                rows={6}
                placeholder="예: 결제 실패 시 리트라이 정책과 사용자 안내 문구를 어떻게 나누면 좋을까요?"
                className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />

              <div className="flex justify-end">
                <button
                  onClick={submitQuestion}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" /> 질문 전달 후 타임라인으로 이동
                </button>
              </div>
            </div>
          </div>
        </section>

        {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">
                  파이프라인 관리 선택
                </h4>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    기능 선택
                  </p>
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => {
                        setPickerFeatureId(String(feature.id));
                        setPickerTaskId("");
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                        pickerFeatureId === String(feature.id)
                          ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {feature.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    세부작업 선택
                  </p>

                  <button
                    onClick={() => setPickerTaskId("")}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      pickerTaskId === ""
                        ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    기능 전체
                  </button>

                  {(
                    features.find(
                      (feature) => String(feature.id) === pickerFeatureId,
                    )?.tasks ?? []
                  ).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setPickerTaskId(task.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                        pickerTaskId === task.id
                          ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={confirmPicker}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  선택 완료
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (section === "pipeline") {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px] space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5" /> 기능 그래프 파이프라인
          </h3>
          <div className="inline-flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <span className="text-sm font-medium text-indigo-900">
              기획 확인 진행률
            </span>
            <span className="text-2xl font-bold text-indigo-600">
              {totalProgress}%
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={newFeatureName}
            onChange={(event) => setNewFeatureName(event.target.value)}
            maxLength={FEATURE_NAME_MAX_LENGTH}
            placeholder="새 기능 이름을 입력하세요"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            onClick={createFeature}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> 기능 추가
          </button>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex items-start gap-3 min-w-full">
            {features.map((feature, index) => {
              const isExpanded = expandedFeatureIds.includes(feature.id);
              const progress = calculateProgress(feature.tasks);

              return (
                <div key={feature.id} className="inline-flex items-start gap-3">
                  <article
                    draggable={editingFeatureId !== feature.id}
                    onDragStart={() => setDraggingFeatureId(feature.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (dragOverFeatureId !== feature.id) {
                        setDragOverFeatureId(feature.id);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (draggingFeatureId === null) return;
                      reorderFeatures(draggingFeatureId, feature.id);
                      setDraggingFeatureId(null);
                      setDragOverFeatureId(null);
                    }}
                    onDragEnd={() => {
                      setDraggingFeatureId(null);
                      setDragOverFeatureId(null);
                    }}
                    className={`w-[280px] sm:w-[320px] rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                      draggingFeatureId === feature.id ? "opacity-60" : ""
                    } ${
                      dragOverFeatureId === feature.id &&
                      draggingFeatureId !== feature.id
                        ? "border-indigo-300 ring-2 ring-indigo-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className="min-w-0 flex-1 cursor-pointer rounded-lg px-1 py-1 hover:bg-gray-50"
                          onClick={() => {
                            if (editingFeatureId === feature.id) return;
                            toggleFeatureExpand(feature.id);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (editingFeatureId === feature.id) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleFeatureExpand(feature.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                            )}

                            <div className="min-w-0 flex-1">
                              {editingFeatureId === feature.id ? (
                                <input
                                  value={editingFeatureName}
                                  maxLength={FEATURE_NAME_MAX_LENGTH}
                                  onClick={(event) => event.stopPropagation()}
                                  onChange={(event) =>
                                    setEditingFeatureName(event.target.value)
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm"
                                />
                              ) : (
                                <h4 className="font-semibold text-gray-900 break-words leading-snug">
                                  {feature.name}
                                </h4>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <GripVertical className="h-3.5 w-3.5" />
                          드래그로 순서 변경
                        </span>

                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {editingFeatureId === feature.id ? (
                            <>
                              <button
                                onClick={saveFeatureEdit}
                                className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingFeatureId(null);
                                  setEditingFeatureName("");
                                }}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-600"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditFeature(feature)}
                                className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
                                title="기능 이름 수정"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteFeature(feature.id)}
                                className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-red-50"
                                title="기능 삭제"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                        DEV 체크 {progress.dev}%
                      </div>
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1.5">
                        PM 확인 {progress.pm}%
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-2">
                        {feature.tasks.length === 0 && (
                          <p className="text-xs text-gray-400">
                            등록된 세부작업이 없습니다.
                          </p>
                        )}

                        {feature.tasks.map((task) => {
                          const isTaskEditing =
                            editingTaskKey ===
                            getTaskEditKey(feature.id, task.id);
                          const currentTaskKey = getTaskEditKey(
                            feature.id,
                            task.id,
                          );
                          const isTaskDragOver =
                            dragOverTaskKey === currentTaskKey &&
                            draggingTask !== null &&
                            draggingTask.taskId !== task.id;

                          return (
                            <div
                              key={task.id}
                              draggable={!isTaskEditing}
                              onDragStart={() =>
                                setDraggingTask({
                                  featureId: feature.id,
                                  taskId: task.id,
                                })
                              }
                              onDragOver={(event) => {
                                if (
                                  draggingTask === null ||
                                  draggingTask.featureId !== feature.id
                                ) {
                                  return;
                                }
                                event.preventDefault();
                                if (dragOverTaskKey !== currentTaskKey) {
                                  setDragOverTaskKey(currentTaskKey);
                                }
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                if (
                                  draggingTask === null ||
                                  draggingTask.featureId !== feature.id
                                ) {
                                  return;
                                }
                                reorderTasks(
                                  feature.id,
                                  draggingTask.taskId,
                                  task.id,
                                );
                                setDraggingTask(null);
                                setDragOverTaskKey(null);
                              }}
                              onDragEnd={() => {
                                setDraggingTask(null);
                                setDragOverTaskKey(null);
                              }}
                              className={`rounded-lg border bg-gray-50 px-3 py-2 transition-all ${
                                isTaskDragOver
                                  ? "border-indigo-300 ring-1 ring-indigo-200"
                                  : "border-gray-200"
                              } ${
                                draggingTask?.taskId === task.id
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  {isTaskEditing ? (
                                    <input
                                      value={editingTaskTitle}
                                      maxLength={TASK_TITLE_MAX_LENGTH}
                                      onChange={(event) =>
                                        setEditingTaskTitle(event.target.value)
                                      }
                                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                                    />
                                  ) : (
                                    <>
                                      <p className="text-xs font-medium text-gray-800 whitespace-normal break-words leading-snug">
                                        {task.title}
                                      </p>
                                      <p className="text-[11px] text-gray-500 mt-0.5">
                                        {task.devChecked
                                          ? "DEV 체크 완료"
                                          : "DEV 체크 대기"}
                                      </p>
                                    </>
                                  )}
                                </div>

                                <input
                                  type="checkbox"
                                  checked={task.pmConfirmed}
                                  disabled={!task.devChecked}
                                  onChange={() =>
                                    onTogglePmTaskConfirm(feature.id, task.id)
                                  }
                                  className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-end gap-1">
                                {isTaskEditing ? (
                                  <>
                                    <button
                                      onClick={() =>
                                        saveTaskEdit(feature.id, task.id)
                                      }
                                      className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={cancelTaskEdit}
                                      className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600"
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() =>
                                        startEditTask(feature.id, task)
                                      }
                                      className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-100"
                                      title="세부작업 수정"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteTask(feature.id, task.id)
                                      }
                                      className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-red-50"
                                      title="세부작업 삭제"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            value={taskDrafts[feature.id] ?? ""}
                            maxLength={TASK_TITLE_MAX_LENGTH}
                            onChange={(event) =>
                              setTaskDrafts((prev) => ({
                                ...prev,
                                [feature.id]: event.target.value,
                              }))
                            }
                            placeholder="세부작업 추가"
                            className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs"
                          />
                          <button
                            onClick={() => addTask(feature.id)}
                            className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white"
                          >
                            추가
                          </button>
                        </div>
                      </div>
                    )}
                  </article>

                  {index < features.length - 1 && (
                    <div className="pt-16">
                      <ArrowRight className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  const firstQuestionMessage =
    selectedQuestion?.messages.find((message) => message.role === "pm") ??
    selectedQuestion?.messages[0];

  const latestMessage = selectedQuestion
    ? selectedQuestion.messages[selectedQuestion.messages.length - 1]
    : undefined;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-5">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm min-h-[620px] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">질문 리스트</h3>
          <button
            onClick={() => onMoveSection("pm-ai")}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> 새 질문
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeQuestions.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-500">
              진행중인 질문이 없습니다.
            </div>
          )}

          {activeQuestions.map((question) => {
            const firstMessage =
              question.messages[0]?.content ?? "(메시지 없음)";
            const selected = selectedQuestion?.id === question.id;
            return (
              <button
                key={question.id}
                onClick={() => setSelectedQuestionId(question.id)}
                className={`w-full rounded-xl border p-3 text-left ${
                  selected
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-700 break-words leading-snug">
                      {question.featureName}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 break-words leading-snug">
                      {question.taskTitle ?? "기능 전체"}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                      question.pmConfirmed
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {question.pmConfirmed ? "컨펌 대기" : "대화중"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {firstMessage}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> 기능 질문 타임라인
          </h3>
        </div>

        {!selectedQuestion && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            질문 리스트에서 항목을 선택해주세요.
          </div>
        )}

        {selectedQuestion && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {selectedQuestion.messages.map((message) => {
                const isPm = message.role === "pm";
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isPm ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl border px-3 py-2 ${
                        isPm
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white border-gray-200 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-[11px] font-semibold ${isPm ? "text-indigo-100" : "text-gray-500"}`}
                        >
                          {isPm ? "PM" : "DEV"} · {message.createdAt}
                        </p>
                        {isPm && !selectedQuestion.pmConfirmed && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                startEditMessage(message.id, message.content)
                              }
                              className="rounded-md p-1 hover:bg-white/20"
                              title="메시지 수정"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeMessage(message.id)}
                              className="rounded-md p-1 hover:bg-white/20"
                              title="메시지 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={3}
                            value={editingMessageInput}
                            maxLength={TIMELINE_MESSAGE_MAX_LENGTH}
                            onChange={(event) =>
                              setEditingMessageInput(event.target.value)
                            }
                            className="w-full rounded-lg border border-white/50 bg-white text-gray-800 px-2.5 py-2 text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingMessageInput("");
                              }}
                              className="rounded-lg border border-white/70 px-2.5 py-1 text-xs"
                            >
                              취소
                            </button>
                            <button
                              onClick={saveEditedMessage}
                              className="rounded-lg bg-white text-indigo-700 px-2.5 py-1 text-xs font-semibold"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newMessageInput}
                  maxLength={TIMELINE_MESSAGE_MAX_LENGTH}
                  onChange={(event) => setNewMessageInput(event.target.value)}
                  disabled={selectedQuestion.pmConfirmed}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    if (event.nativeEvent.isComposing) return;
                    event.preventDefault();
                    submitNewMessage();
                  }}
                  placeholder={
                    selectedQuestion.pmConfirmed
                      ? "컨펌 이후에는 채팅이 잠깁니다"
                      : "추가 질문을 입력하세요"
                  }
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
                <button
                  onClick={submitNewMessage}
                  disabled={selectedQuestion.pmConfirmed}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 text-white hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-5 min-h-[620px]">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <GitPullRequest className="h-5 w-5" /> 요약 타임라인
        </h3>

        {!selectedQuestion && (
          <p className="text-sm text-gray-500">선택된 질문이 없습니다.</p>
        )}

        {selectedQuestion && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="text-xs text-gray-500">기능</p>
              <p className="font-semibold text-gray-900 mt-1">
                {selectedQuestion.featureName}
              </p>
              <p className="text-xs text-gray-500 mt-3">세부작업</p>
              <p className="text-sm text-gray-800 mt-1">
                {selectedQuestion.taskTitle ?? "기능 전체"}
              </p>
              <p className="text-xs text-gray-500 mt-3">질문 생성</p>
              <p className="text-sm text-gray-800 mt-1">
                {selectedQuestion.createdAt}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-2">
              <p className="text-gray-500">질문 본문</p>
              <p className="text-gray-800 leading-relaxed">
                {firstQuestionMessage?.content ?? "질문 내용이 없습니다."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-1">
              <p className="flex items-center justify-between">
                <span className="text-gray-500">PM 컨펌</span>
                <span
                  className={
                    selectedQuestion.pmConfirmed
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  {selectedQuestion.pmConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">DEV 최종확인</span>
                <span
                  className={
                    selectedQuestion.devConfirmed
                      ? "text-green-600"
                      : "text-gray-400"
                  }
                >
                  {selectedQuestion.devConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">질문 상태</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    selectedQuestion.pmConfirmed
                      ? "text-amber-700"
                      : "text-indigo-700"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {selectedQuestion.pmConfirmed
                    ? "DEV 최종확인 대기"
                    : "대화중"}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-2">
              <p className="text-gray-500">이벤트</p>
              <p className="text-gray-800">
                - 질문 생성: {selectedQuestion.createdAt}
              </p>
              <p className="text-gray-800">
                - 최근 업데이트: {latestMessage?.createdAt ?? "-"}
              </p>
              <p className="text-gray-800">
                - 최근 발화자: {latestMessage?.role?.toUpperCase() ?? "-"}
              </p>
            </div>

            <div className="space-y-2">
              {!selectedQuestion.pmConfirmed && (
                <button
                  onClick={() => onConfirmQuestionByPm(selectedQuestion.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700"
                >
                  <Check className="h-4 w-4" /> PM 컨펌 요청
                </button>
              )}

              {selectedQuestion.pmConfirmed && (
                <button
                  onClick={() =>
                    onCancelQuestionConfirmByPm(selectedQuestion.id)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  <X className="h-4 w-4" /> PM 컨펌 취소
                </button>
              )}

              <button
                onClick={() => onDeleteQuestion(selectedQuestion.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> 질문 삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
