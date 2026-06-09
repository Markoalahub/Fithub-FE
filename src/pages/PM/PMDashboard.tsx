import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type {
  Feature,
  FeatureQuestion,
} from "../../types/index";

interface PMDashboardProps {
  section: "ai" | "review";
  features: Feature[];
  featureQuestions: FeatureQuestion[];
  onCreateFeatureQuestion: (payload: { featureId: number; taskId?: string; content: string }) => void;
  onAddQuestionMessage: (questionId: string, content: string) => void;
  onUpdateQuestionMessage: (questionId: string, messageId: string, content: string) => void;
  onDeleteQuestionMessage: (questionId: string, messageId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onConfirmQuestionByPm: (questionId: string) => void;
  onCancelQuestionConfirmByPm: (questionId: string) => void;
  onMoveSection: (section: "ai" | "review") => void;
}

const QUESTION_TEXT_MAX_LENGTH = 280;
const TIMELINE_MESSAGE_MAX_LENGTH = 220;

const PM_TO_DEV_TRANSLATIONS = [
  "UI 인터랙션 처리 방식과 상태 관리 패턴을 정의해야 합니다. 서버 사이드 유효성 검사와 클라이언트 사이드 유효성 검사를 분리 구현하는 것이 좋습니다.",
  "이 요구사항은 비동기 데이터 fetching에서 race condition이 발생할 수 있습니다. useEffect 의존성 배열과 cleanup 처리가 필요합니다.",
  "API 응답 스키마를 정의하고, 에러 핸들링 시 HTTP 상태 코드 체계에 맞게 예외 처리를 구현해야 합니다.",
  "캐싱 전략이 필요합니다. CDN과 애플리케이션 레이어에서 각각 TTL을 설정하는 방식이 적합합니다.",
  "DB 스키마 변경이 필요하며, 마이그레이션 스크립트와 롤백 플랜을 먼저 작성하는 것이 안전합니다.",
];

const DEV_TO_PM_TRANSLATIONS = [
  "사용자가 버튼을 누른 후 결과를 바로 볼 수 있어야 합니다. 처리 시간이 길면 로딩 표시를 보여주는 것이 좋겠습니다.",
  "이 작업은 사용자 데이터를 안전하게 보관하는 방법을 결정해야 합니다. 보안 정책에 따라 저장 방식이 달라질 수 있습니다.",
  "화면 전환 시 사용자 흐름이 자연스럽게 이어져야 합니다. 이전 입력값이 유지되는지 여부를 기획 단계에서 정의해 주세요.",
  "이 기능을 구현하는 데 예상보다 시간이 더 걸릴 수 있습니다. 우선순위가 높은 기능부터 재조율하면 어떨까요?",
  "외부 서비스 연동이 필요합니다. 계약 또는 API 사용 조건을 미리 확인해 주시면 일정 산정에 도움이 됩니다.",
];

const getAiTranslation = (messageId: string, role: "pm" | "dev-fe" | "dev-be"): string => {
  const hash = (messageId.charCodeAt(messageId.length - 1) ?? 0) + (messageId.charCodeAt(messageId.length - 2) ?? 0);
  return role === "pm"
    ? PM_TO_DEV_TRANSLATIONS[hash % PM_TO_DEV_TRANSLATIONS.length]
    : DEV_TO_PM_TRANSLATIONS[hash % DEV_TO_PM_TRANSLATIONS.length];
};

export default function PMDashboard({
  section,
  features,
  featureQuestions,
  onCreateFeatureQuestion,
  onAddQuestionMessage,
  onUpdateQuestionMessage,
  onDeleteQuestionMessage,
  onDeleteQuestion,
  onConfirmQuestionByPm,
  onCancelQuestionConfirmByPm,
  onMoveSection,
}: PMDashboardProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [pickerFeatureId, setPickerFeatureId] = useState("");
  const [pickerTaskId, setPickerTaskId] = useState("");
  const [questionInput, setQuestionInput] = useState("");

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [newMessageInput, setNewMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageInput, setEditingMessageInput] = useState("");
  const [expandedTranslations, setExpandedTranslations] = useState<Set<string>>(new Set());

  const activeQuestions = useMemo(
    () => featureQuestions.filter((q) => !q.closed),
    [featureQuestions],
  );

  const selectedQuestion = useMemo(() => {
    if (activeQuestions.length === 0) return null;
    if (!selectedQuestionId) return activeQuestions[0];
    return activeQuestions.find((q) => q.id === selectedQuestionId) ?? activeQuestions[0];
  }, [activeQuestions, selectedQuestionId]);

  useEffect(() => {
    if (!selectedQuestion) { setSelectedQuestionId(null); return; }
    if (selectedQuestionId !== selectedQuestion.id) setSelectedQuestionId(selectedQuestion.id);
  }, [selectedQuestion, selectedQuestionId]);

  useEffect(() => {
    if (selectedFeatureId) {
      const matchedFeature = features.find((f) => String(f.id) === selectedFeatureId);
      if (!matchedFeature) { setSelectedFeatureId(""); setSelectedTaskId(""); }
      else if (selectedTaskId && !matchedFeature.tasks.some((t) => t.id === selectedTaskId)) setSelectedTaskId("");
    }
    if (pickerFeatureId) {
      const matchedFeature = features.find((f) => String(f.id) === pickerFeatureId);
      if (!matchedFeature) { setPickerFeatureId(""); setPickerTaskId(""); }
      else if (pickerTaskId && !matchedFeature.tasks.some((t) => t.id === pickerTaskId)) setPickerTaskId("");
    }
  }, [features, pickerFeatureId, pickerTaskId, selectedFeatureId, selectedTaskId]);

  const toggleTranslation = (id: string) => setExpandedTranslations((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const selectedFeature = features.find((f) => String(f.id) === selectedFeatureId);
  const selectedTask = selectedFeature?.tasks.find((t) => t.id === selectedTaskId);

  const openPicker = () => {
    setPickerFeatureId(selectedFeatureId || String(features[0]?.id ?? ""));
    setPickerTaskId(selectedTaskId);
    setIsPickerOpen(true);
  };

  const confirmPicker = () => { setSelectedFeatureId(pickerFeatureId); setSelectedTaskId(pickerTaskId); setIsPickerOpen(false); };

  const submitQuestion = () => {
    const featureIdNumber = Number(selectedFeatureId);
    const trimmedQuestion = questionInput.trim().slice(0, QUESTION_TEXT_MAX_LENGTH);
    if (!featureIdNumber || !trimmedQuestion) return;
    onCreateFeatureQuestion({ featureId: featureIdNumber, taskId: selectedTaskId || undefined, content: trimmedQuestion });
    setQuestionInput("");
    onMoveSection("review");
  };

  const submitNewMessage = () => {
    const trimmed = newMessageInput.trim().slice(0, TIMELINE_MESSAGE_MAX_LENGTH);
    if (!selectedQuestion || !trimmed) return;
    onAddQuestionMessage(selectedQuestion.id, trimmed);
    setNewMessageInput("");
  };

  const startEditMessage = (messageId: string, content: string) => { setEditingMessageId(messageId); setEditingMessageInput(content); };

  const saveEditedMessage = () => {
    const trimmed = editingMessageInput.trim().slice(0, TIMELINE_MESSAGE_MAX_LENGTH);
    if (!selectedQuestion || !editingMessageId || !trimmed) return;
    onUpdateQuestionMessage(selectedQuestion.id, editingMessageId, trimmed);
    setEditingMessageId(null); setEditingMessageInput("");
  };

  const removeMessage = (messageId: string) => {
    if (!selectedQuestion) return;
    onDeleteQuestionMessage(selectedQuestion.id, messageId);
    if (editingMessageId === messageId) { setEditingMessageId(null); setEditingMessageInput(""); }
  };

  const firstQuestionMessage = selectedQuestion?.messages.find((m) => m.role === "pm") ?? selectedQuestion?.messages[0];
  const latestMessage = selectedQuestion?.messages[selectedQuestion.messages.length - 1];

  if (section === "ai") {
    return (
      <>
        <section className="rounded-2xl border border-gray-200 bg-white p-8 min-h-[620px]">
          <div className="mb-6 flex items-center gap-2 text-xs">
            <span className="text-gray-400">파이프라인</span>
            <span className="text-gray-200">→</span>
            <span className="font-semibold text-gray-900">기능 질문</span>
            <span className="text-gray-200">→</span>
            <button onClick={() => onMoveSection("review")} className="text-gray-400 hover:text-gray-700 transition-colors">질문 타임라인</button>
          </div>

          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">기능 질문 전달</h3>
              <p className="text-sm text-gray-500 mt-1">파이프라인에서 기능/세부작업을 선택한 뒤 개발자에게 질문을 보냅니다.</p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">기능 선택</p>
                <button
                  onClick={openPicker}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <GitPullRequest className="h-4 w-4" /> 파이프라인에서 선택
                </button>
                {selectedFeatureId && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">선택된 기능</p>
                      <p className="text-sm font-medium text-gray-900">{selectedFeature?.name ?? "—"}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">선택된 세부작업</p>
                      <p className="text-sm font-medium text-gray-900">{selectedTask?.title ?? "기능 전체"}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
                  개발자에게 전달할 질문
                </label>
                <textarea
                  value={questionInput}
                  maxLength={QUESTION_TEXT_MAX_LENGTH}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  rows={6}
                  placeholder="예: 결제 실패 시 리트라이 정책과 사용자 안내 문구를 어떻게 나누면 좋을까요?"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-300"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{questionInput.length}/{QUESTION_TEXT_MAX_LENGTH}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={submitQuestion}
                  disabled={!selectedFeatureId || !questionInput.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <Send className="h-4 w-4" /> 질문 전달 후 타임라인으로 이동
                </button>
              </div>
            </div>
          </div>
        </section>

        {isPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">기능/세부작업 선택</h4>
                <button onClick={() => setIsPickerOpen(false)} className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">기능</p>
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => { setPickerFeatureId(String(feature.id)); setPickerTaskId(""); }}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        pickerFeatureId === String(feature.id)
                          ? "border-gray-900 bg-gray-50 font-semibold text-gray-900"
                          : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {feature.name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">세부작업</p>
                  <button
                    onClick={() => setPickerTaskId("")}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      pickerTaskId === "" ? "border-gray-900 bg-gray-50 font-semibold text-gray-900" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    기능 전체
                  </button>
                  {(features.find((f) => String(f.id) === pickerFeatureId)?.tasks ?? []).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setPickerTaskId(task.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        pickerTaskId === task.id ? "border-gray-900 bg-gray-50 font-semibold text-gray-900" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button onClick={() => setIsPickerOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={confirmPicker} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">선택 완료</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[260px_1fr_280px] gap-4">
      <div className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">질문 목록</h3>
          <button onClick={() => onMoveSection("ai")} className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
            <Plus className="h-3 w-3" /> 새 질문
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeQuestions.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-400">진행중인 질문이 없습니다.</div>
          )}
          {activeQuestions.map((question) => {
            const firstMessage = question.messages[0]?.content ?? "(메시지 없음)";
            const selected = selectedQuestion?.id === question.id;
            return (
              <button
                key={question.id}
                onClick={() => setSelectedQuestionId(question.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${selected ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 break-words leading-snug">{question.featureName}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 break-words">{question.taskTitle ?? "기능 전체"}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{question.pmConfirmed ? "컨펌 대기" : "대화중"}</span>
                </div>
                <p className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-words leading-relaxed line-clamp-2">{firstMessage}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white min-h-[620px] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" /> 질문 타임라인
          </h3>
        </div>

        {!selectedQuestion && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">질문 목록에서 항목을 선택해주세요.</div>
        )}

        {selectedQuestion && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-700">{selectedQuestion.featureName}</span>
                <span className="rounded-md bg-gray-100 px-2.5 py-1 font-medium text-gray-600">{selectedQuestion.taskTitle ?? "기능 전체"}</span>
                <span className="text-gray-400">생성 {selectedQuestion.createdAt}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selectedQuestion.messages.map((message) => {
                const isPm = message.role === "pm";
                const isEditing = editingMessageId === message.id;
                return (
                  <div key={message.id} className={`flex ${isPm ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isPm ? "bg-gray-900 text-white rounded-br-sm" : "bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-sm"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] font-semibold ${isPm ? "text-white/60" : "text-gray-400"}`}>{isPm ? "PM" : "DEV"} · {message.createdAt}</p>
                        {isPm && !selectedQuestion.pmConfirmed && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEditMessage(message.id, message.content)} className="rounded p-0.5 hover:bg-white/20"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => removeMessage(message.id)} className="rounded p-0.5 hover:bg-white/20"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            rows={3}
                            value={editingMessageInput}
                            maxLength={TIMELINE_MESSAGE_MAX_LENGTH}
                            onChange={(e) => setEditingMessageInput(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-2.5 py-2 text-sm focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setEditingMessageId(null); setEditingMessageInput(""); }} className={`rounded-lg border px-2.5 py-1 text-xs ${isPm ? "border-white/30 text-white/80" : "border-gray-200 text-gray-600"}`}>취소</button>
                            <button onClick={saveEditedMessage} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${isPm ? "bg-white text-gray-900" : "bg-gray-900 text-white"}`}>저장</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <button
                            onClick={() => toggleTranslation(message.id)}
                            className={`mt-2 flex items-center gap-1 text-[10px] ${isPm ? "text-white/40 hover:text-white/70" : "text-gray-300 hover:text-gray-500"}`}
                          >
                            AI 번역 {expandedTranslations.has(message.id) ? "▲" : "▼"}
                          </button>
                          {expandedTranslations.has(message.id) && (
                            <div className={`mt-1.5 rounded-lg px-3 py-2 ${isPm ? "bg-white/10" : "bg-gray-100 border border-gray-200"}`}>
                              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${isPm ? "text-white/40" : "text-gray-400"}`}>
                                AI 번역 → {isPm ? "개발자 용어" : "기획자 용어"}
                              </p>
                              <p className={`text-xs italic leading-relaxed ${isPm ? "text-white/60" : "text-gray-500"}`}>
                                {getAiTranslation(message.id, message.role)}
                              </p>
                            </div>
                          )}
                        </>
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
                  onChange={(e) => setNewMessageInput(e.target.value)}
                  disabled={selectedQuestion.pmConfirmed}
                  onKeyDown={(e) => { if (e.key !== "Enter" || e.nativeEvent.isComposing) return; e.preventDefault(); submitNewMessage(); }}
                  placeholder={selectedQuestion.pmConfirmed ? "컨펌 이후에는 채팅이 잠깁니다" : "추가 질문을 입력하세요"}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button onClick={submitNewMessage} disabled={selectedQuestion.pmConfirmed} className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 text-white hover:bg-gray-800 disabled:bg-gray-200">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 min-h-[620px]">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <GitPullRequest className="h-4 w-4 text-gray-400" /> 요약
        </h3>

        {!selectedQuestion && <p className="text-sm text-gray-400">선택된 질문이 없습니다.</p>}

        {selectedQuestion && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">기능</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{selectedQuestion.featureName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-3">세부작업</p>
              <p className="text-sm text-gray-700 mt-1">{selectedQuestion.taskTitle ?? "기능 전체"}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-3">생성</p>
              <p className="text-sm text-gray-700 mt-1">{selectedQuestion.createdAt}</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 text-xs space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">질문 본문</p>
              <p className="text-gray-700 leading-relaxed">{firstQuestionMessage?.content ?? "질문 내용이 없습니다."}</p>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 text-xs space-y-2">
              <p className="flex items-center justify-between">
                <span className="text-gray-500">PM 컨펌</span>
                <span className={selectedQuestion.pmConfirmed ? "font-semibold text-gray-900" : "text-gray-400"}>
                  {selectedQuestion.pmConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">DEV 최종확인</span>
                <span className={selectedQuestion.devConfirmed ? "font-semibold text-gray-900" : "text-gray-400"}>
                  {selectedQuestion.devConfirmed ? "완료" : "대기"}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">최근 업데이트</span>
                <span className="text-gray-600">{latestMessage?.createdAt ?? "—"}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-gray-500">질문 상태</span>
                <span className="font-medium text-gray-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedQuestion.pmConfirmed ? "DEV 최종확인 대기" : "대화중"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              {!selectedQuestion.pmConfirmed && (
                <button
                  onClick={() => onConfirmQuestionByPm(selectedQuestion.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  <Check className="h-3.5 w-3.5" /> PM 컨펌
                </button>
              )}

              {selectedQuestion.pmConfirmed && (
                <button
                  onClick={() => onCancelQuestionConfirmByPm(selectedQuestion.id)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-3.5 w-3.5" /> PM 컨펌 취소
                </button>
              )}

              <button
                onClick={() => onDeleteQuestion(selectedQuestion.id)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> 질문 삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
