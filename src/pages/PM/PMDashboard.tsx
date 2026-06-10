import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { FeatureQuestion } from "../../types/index";

interface PMDashboardProps {
  section: "ai" | "review";
  featureQuestions: FeatureQuestion[];
  onAddQuestionMessage: (questionId: string, content: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onConfirmQuestionByPm: (questionId: string) => void;
  onCancelQuestionConfirmByPm: (questionId: string) => void;
  onMoveSection: (section: "ai" | "review") => void;
}

const TIMELINE_MESSAGE_MAX_LENGTH = 220;

export default function PMDashboard({
  section,
  featureQuestions,
  onAddQuestionMessage,
  onDeleteQuestion,
  onConfirmQuestionByPm,
  onCancelQuestionConfirmByPm,
  onMoveSection,
}: PMDashboardProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [newMessageInput, setNewMessageInput] = useState("");

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

  const firstQuestionMessage =
    selectedQuestion?.messages.find((message) => message.role === "pm") ??
    selectedQuestion?.messages[0];

  const latestMessage =
    selectedQuestion?.messages[selectedQuestion.messages.length - 1];

  useEffect(() => {
    if (!selectedQuestion) {
      setSelectedQuestionId(null);
      return;
    }

    if (selectedQuestionId !== selectedQuestion.id) {
      setSelectedQuestionId(selectedQuestion.id);
    }
  }, [selectedQuestion, selectedQuestionId]);

  const submitNewMessage = () => {
    const trimmed = newMessageInput
      .trim()
      .slice(0, TIMELINE_MESSAGE_MAX_LENGTH);

    if (!selectedQuestion || !trimmed) return;

    onAddQuestionMessage(selectedQuestion.id, trimmed);
    setNewMessageInput("");
  };

  if (section === "ai") {
    return (
      <section className="min-h-[620px] rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#F6F6F4] px-3 py-1.5 text-xs font-semibold text-neutral-500">
            Fithub Beta
          </div>

          <h2 className="text-2xl font-black tracking-tight text-neutral-950">
            기능 질문은 준비중입니다.
          </h2>

          <p className="mt-3 max-w-md text-sm leading-7 text-neutral-500">
            현재 베타에서는 PRD 기반 FE/BE 파이프라인 생성과 실시간 공유 흐름에
            집중하고 있습니다. 기능별 질문 생성은 이후 업데이트에서 제공될
            예정입니다.
          </p>

          <button
            type="button"
            onClick={() => onMoveSection("review")}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            질문 타임라인 보기
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_300px]">
      {/* Question List */}
      <aside className="flex min-h-[620px] flex-col rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            PM Review
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-neutral-950">
              질문 타임라인
            </h3>
            <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold text-white">
              {activeQuestions.length}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {activeQuestions.length === 0 && (
            <div className="flex min-h-[440px] items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-[#F6F6F4] p-5 text-center">
              <div>
                <MessageSquare className="mx-auto h-6 w-6 text-neutral-300" />
                <p className="mt-3 text-sm font-semibold text-neutral-500">
                  진행중인 질문이 없습니다.
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-400">
                  개발자와 공유된 질문이 생기면 이곳에 표시됩니다.
                </p>
              </div>
            </div>
          )}

          {activeQuestions.map((question) => {
            const firstMessage =
              question.messages[0]?.content ?? "(메시지 없음)";
            const selected = selectedQuestion?.id === question.id;

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => setSelectedQuestionId(question.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300 hover:bg-[#F6F6F4]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={`break-words text-sm font-bold leading-snug ${
                        selected ? "text-white" : "text-neutral-950"
                      }`}
                    >
                      {question.featureName}
                    </p>
                    <p
                      className={`mt-1 break-words text-xs ${
                        selected ? "text-neutral-400" : "text-neutral-400"
                      }`}
                    >
                      {question.taskTitle ?? "기능 전체"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      question.pmConfirmed
                        ? selected
                          ? "bg-white text-neutral-950"
                          : "bg-neutral-950 text-white"
                        : selected
                          ? "bg-white/10 text-neutral-300"
                          : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {question.pmConfirmed ? "컨펌" : "대화중"}
                  </span>
                </div>

                <p
                  className={`mt-3 line-clamp-2 break-words text-xs leading-5 ${
                    selected ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {firstMessage}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Timeline */}
      <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                Conversation
              </p>
              <h3 className="mt-2 flex items-center gap-2 text-base font-black text-neutral-950">
                <MessageSquare className="h-4 w-4 text-neutral-400" />
                질문 대화
              </h3>
            </div>

            {selectedQuestion && (
              <span className="rounded-full border border-neutral-200 bg-[#F6F6F4] px-3 py-1 text-xs font-semibold text-neutral-500">
                생성 {selectedQuestion.createdAt}
              </span>
            )}
          </div>
        </div>

        {!selectedQuestion && (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <MessageSquare className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm font-semibold text-neutral-500">
                질문 목록에서 항목을 선택해주세요.
              </p>
            </div>
          </div>
        )}

        {selectedQuestion && (
          <>
            <div className="border-b border-neutral-100 bg-[#F6F6F4] px-5 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-neutral-800">
                  {selectedQuestion.featureName}
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold text-neutral-500">
                  {selectedQuestion.taskTitle ?? "기능 전체"}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {selectedQuestion.messages.map((message) => {
                const isPm = message.role === "pm";

                return (
                  <div
                    key={message.id}
                    className={`flex ${isPm ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${
                        isPm
                          ? "rounded-br-md bg-neutral-950 text-white"
                          : "rounded-bl-md border border-neutral-200 bg-[#F6F6F4] text-neutral-800"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                          isPm ? "text-white/50" : "text-neutral-400"
                        }`}
                      >
                        {isPm ? "PM" : "DEV"} · {message.createdAt}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-100 p-4">
              <div className="flex gap-2">
                <input
                  value={newMessageInput}
                  maxLength={TIMELINE_MESSAGE_MAX_LENGTH}
                  onChange={(event) => setNewMessageInput(event.target.value)}
                  disabled={selectedQuestion.pmConfirmed}
                  onKeyDown={(event) => {
                    if (
                      event.key !== "Enter" ||
                      event.nativeEvent.isComposing
                    ) {
                      return;
                    }

                    event.preventDefault();
                    submitNewMessage();
                  }}
                  placeholder={
                    selectedQuestion.pmConfirmed
                      ? "PM 컨펌 이후에는 메시지를 추가할 수 없습니다."
                      : "추가 메시지를 입력하세요."
                  }
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-950 disabled:bg-neutral-50 disabled:text-neutral-400"
                />

                <button
                  type="button"
                  onClick={submitNewMessage}
                  disabled={
                    selectedQuestion.pmConfirmed || !newMessageInput.trim()
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-4 text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 text-right text-xs text-neutral-400">
                {newMessageInput.length}/{TIMELINE_MESSAGE_MAX_LENGTH}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <aside className="min-h-[620px] rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            Summary
          </p>
          <h3 className="mt-2 text-base font-black text-neutral-950">
            질문 요약
          </h3>
        </div>

        {!selectedQuestion && (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-[#F6F6F4] p-5 text-center">
            <Clock3 className="mx-auto h-6 w-6 text-neutral-300" />
            <p className="mt-3 text-sm font-semibold text-neutral-500">
              선택된 질문이 없습니다.
            </p>
          </div>
        )}

        {selectedQuestion && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-neutral-200 bg-[#F6F6F4] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                기능
              </p>
              <p className="mt-1 text-sm font-bold text-neutral-950">
                {selectedQuestion.featureName}
              </p>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                세부작업
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {selectedQuestion.taskTitle ?? "기능 전체"}
              </p>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                생성
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                {selectedQuestion.createdAt}
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                질문 본문
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {firstQuestionMessage?.content ?? "질문 내용이 없습니다."}
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 p-4 text-xs">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500">PM 컨펌</span>
                <span
                  className={
                    selectedQuestion.pmConfirmed
                      ? "font-bold text-neutral-950"
                      : "text-neutral-400"
                  }
                >
                  {selectedQuestion.pmConfirmed ? "완료" : "대기"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500">DEV 최종확인</span>
                <span
                  className={
                    selectedQuestion.devConfirmed
                      ? "font-bold text-neutral-950"
                      : "text-neutral-400"
                  }
                >
                  {selectedQuestion.devConfirmed ? "완료" : "대기"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500">최근 업데이트</span>
                <span className="text-neutral-600">
                  {latestMessage?.createdAt ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500">질문 상태</span>
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {selectedQuestion.pmConfirmed ? "DEV 확인 대기" : "대화중"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {!selectedQuestion.pmConfirmed && (
                <button
                  type="button"
                  onClick={() => onConfirmQuestionByPm(selectedQuestion.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-neutral-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  PM 컨펌
                </button>
              )}

              {selectedQuestion.pmConfirmed && (
                <button
                  type="button"
                  onClick={() =>
                    onCancelQuestionConfirmByPm(selectedQuestion.id)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
                >
                  <X className="h-3.5 w-3.5" />
                  PM 컨펌 취소
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteQuestion(selectedQuestion.id)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-semibold text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                질문 삭제
              </button>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
