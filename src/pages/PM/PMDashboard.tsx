import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitPullRequest,
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
  onTogglePmTaskConfirm: (featureId: number, taskId: string) => void;
  onMoveSection: (section: "pm-ai" | "pm-pipeline" | "pm-review") => void;
}

const makeTaskId = (featureId: number) => `${featureId}-${Date.now()}`;

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

  const moveFeature = (featureId: number, direction: "left" | "right") => {
    setFeatures((prev) => {
      const currentIndex = prev.findIndex(
        (feature) => feature.id === featureId,
      );
      if (currentIndex === -1) return prev;

      const targetIndex =
        direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [item] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const createFeature = () => {
    const trimmed = newFeatureName.trim();
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
    const trimmed = editingFeatureName.trim();
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
    const draft = (taskDrafts[featureId] ?? "").trim();
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
    if (!featureIdNumber || !questionInput.trim()) return;

    onCreateFeatureQuestion({
      featureId: featureIdNumber,
      taskId: selectedTaskId || undefined,
      content: questionInput,
    });
    setQuestionInput("");
    onMoveSection("pm-review");
  };

  const submitNewMessage = () => {
    if (!selectedQuestion || !newMessageInput.trim()) return;
    onAddQuestionMessage(selectedQuestion.id, newMessageInput);
    setNewMessageInput("");
  };

  const startEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingMessageInput(content);
  };

  const saveEditedMessage = () => {
    if (!selectedQuestion || !editingMessageId || !editingMessageInput.trim())
      return;
    onUpdateQuestionMessage(
      selectedQuestion.id,
      editingMessageId,
      editingMessageInput,
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

  const totalTasks = features.reduce(
    (acc, feature) => acc + feature.tasks.length,
    0,
  );
  const totalPmConfirmed = features.reduce(
    (acc, feature) =>
      acc + feature.tasks.filter((task) => task.pmConfirmed).length,
    0,
  );
  const totalProgress =
    totalTasks === 0 ? 0 : Math.round((totalPmConfirmed / totalTasks) * 100);

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
                  <article className="w-[320px] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => toggleFeatureExpand(feature.id)}
                        className="inline-flex items-center gap-2 text-left"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-indigo-500" />
                        )}

                        {editingFeatureId === feature.id ? (
                          <input
                            value={editingFeatureName}
                            onChange={(event) =>
                              setEditingFeatureName(event.target.value)
                            }
                            className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          />
                        ) : (
                          <h4 className="font-semibold text-gray-900">
                            {feature.name}
                          </h4>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveFeature(feature.id, "left")}
                          className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
                          title="왼쪽으로 이동"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveFeature(feature.id, "right")}
                          className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
                          title="오른쪽으로 이동"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>

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

                        {feature.tasks.map((task) => (
                          <label
                            key={task.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {task.title}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {task.devChecked
                                  ? "DEV 체크 완료"
                                  : "DEV 체크 대기"}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={task.pmConfirmed}
                              disabled={!task.devChecked}
                              onChange={() =>
                                onTogglePmTaskConfirm(feature.id, task.id)
                              }
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </label>
                        ))}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            value={taskDrafts[feature.id] ?? ""}
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

  const selectedSummary = selectedQuestion
    ? {
        messageCount: selectedQuestion.messages.length,
        pmCount: selectedQuestion.messages.filter(
          (message) => message.role === "pm",
        ).length,
        devCount: selectedQuestion.messages.filter(
          (message) => message.role === "dev",
        ).length,
      }
    : null;

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
                    <p className="text-xs font-semibold text-indigo-700 truncate">
                      {question.featureName}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
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
                <p className="mt-2 text-xs text-gray-700 line-clamp-2">
                  {firstMessage}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> 기능 질문 타임라인
          </h3>

          {selectedQuestion && (
            <button
              onClick={() => onDeleteQuestion(selectedQuestion.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> 질문 삭제
            </button>
          )}
        </div>

        {!selectedQuestion && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            질문 리스트에서 항목을 선택해주세요.
          </div>
        )}

        {selectedQuestion && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-2.5 py-1 font-semibold text-indigo-700">
                  {selectedQuestion.featureName}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  {selectedQuestion.taskTitle ?? "기능 전체"}
                </span>
                <span className="text-gray-500">
                  생성 {selectedQuestion.createdAt}
                </span>
              </div>
            </div>

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

            <div className="p-4 border-t border-gray-100 space-y-3">
              {selectedQuestion.pmConfirmed ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                  PM 컨펌 완료됨. 개발자의 최종 확인 시 이 질문이 닫힙니다.
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={newMessageInput}
                      onChange={(event) =>
                        setNewMessageInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        if (event.nativeEvent.isComposing) return;
                        event.preventDefault();
                        submitNewMessage();
                      }}
                      placeholder="추가 질문을 입력하세요"
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                    />
                    <button
                      onClick={submitNewMessage}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 text-white hover:bg-indigo-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => onConfirmQuestionByPm(selectedQuestion.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" /> PM 컨펌 요청
                    </button>
                  </div>
                </>
              )}
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

        {selectedQuestion && selectedSummary && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                {selectedQuestion.featureName}
              </p>
              <p className="text-xs mt-1">
                {selectedQuestion.taskTitle ?? "기능 전체"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-2">
                <p className="font-semibold text-indigo-700">총 메시지</p>
                <p className="text-lg font-bold text-indigo-900 mt-1">
                  {selectedSummary.messageCount}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 px-2 py-2">
                <p className="font-semibold text-blue-700">PM</p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {selectedSummary.pmCount}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2 py-2">
                <p className="font-semibold text-emerald-700">DEV</p>
                <p className="text-lg font-bold text-emerald-900 mt-1">
                  {selectedSummary.devCount}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {selectedQuestion.messages.slice(-6).map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-gray-600">
                    {message.role.toUpperCase()} · {message.createdAt}
                  </p>
                  <p className="mt-1 text-gray-800 line-clamp-2">
                    {message.content}
                  </p>
                </div>
              ))}
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
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 진행중
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
