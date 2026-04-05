import React, { useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  Bot,
  Check,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  Send,
  Settings2,
} from "lucide-react";
import type { Feature, TimelineMessage } from "../../types/index";

interface PMDashboardProps {
  features: Feature[];
  setFeatures: React.Dispatch<React.SetStateAction<Feature[]>>;
  timelineEvents: TimelineMessage[];
  setTimelineEvents: React.Dispatch<React.SetStateAction<TimelineMessage[]>>;
  proposalStatus: "discussing" | "dev_confirmed" | "pm_confirmed";
  setProposalStatus: React.Dispatch<
    React.SetStateAction<"discussing" | "dev_confirmed" | "pm_confirmed">
  >;
  onOpenSettings: () => void;
}

type PMTab = "ai" | "pipeline" | "review";

const quickPrompts = [
  "지금 가장 지연 위험이 큰 기능은 뭐야?",
  "이번 주 안에 QA 가능한 항목만 정리해줘",
  "결제 기능의 남은 작업을 우선순위로 보여줘",
];

export default function PMDashboard({
  features,
  setFeatures,
  timelineEvents,
  setTimelineEvents,
  proposalStatus,
  setProposalStatus,
  onOpenSettings,
}: PMDashboardProps) {
  const [activeTab, setActiveTab] = useState<PMTab>("ai");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "ai",
      content:
        "안녕하세요! 프로젝트 진행 상황이나 기술적인 부분에 대해 궁금한 점을 물어보세요.",
    },
  ]);
  const [feedbackInput, setFeedbackInput] = useState("");

  const calculateProgress = (tasks: Feature["tasks"]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const totalCompletedTasks = features.reduce(
    (acc, f) => acc + f.tasks.filter((t) => t.completed).length,
    0,
  );
  const totalTasks = features.reduce((acc, f) => acc + f.tasks.length, 0);
  const totalProgress =
    totalTasks === 0 ? 0 : Math.round((totalCompletedTasks / totalTasks) * 100);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const nextInput = chatInput;
    setChatHistory((prev) => [...prev, { role: "user", content: nextInput }]);
    setChatInput("");

    setTimeout(() => {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "GitHub 커밋 기록을 확인해본 결과, 현재 결제 모듈 연동 작업이 80% 정도 진행되었습니다. 내일 중으로 테스트 서버에 반영될 예정입니다.",
        },
      ]);
    }, 700);
  };

  const handleSendFeedback = () => {
    if (!feedbackInput.trim()) return;

    const newMessage: TimelineMessage = {
      id: Date.now().toString(),
      role: "pm",
      content: feedbackInput,
      aiTranslation: `[AI 요약] ${feedbackInput.substring(0, 20)}... 관련 기획 의도 전달 및 일정 확인 요청.`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setTimelineEvents((prev) => [...prev, newMessage]);
    setFeedbackInput("");
  };

  const handleFinalConfirm = () => {
    setProposalStatus("pm_confirmed");
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id !== 2) return f;
        return {
          ...f,
          tasks: [
            ...f.tasks,
            {
              id: "2-4",
              title: "결제 실패/오류 예외 처리",
              completed: false,
              isAiSuggested: true,
            },
          ],
        };
      }),
    );
  };

  const getTabClass = (tab: PMTab) =>
    `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
      activeTab === tab
        ? "bg-white text-indigo-700 shadow border border-indigo-100"
        : "text-gray-600 hover:bg-white/70"
    }`;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">기획자 대시보드</h2>
          <p className="text-gray-500 mt-1">
            한 번에 한 섹션에 집중할 수 있도록 화면을 탭으로 분리했습니다.
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-indigo-200 hover:text-indigo-700"
        >
          <Settings2 className="h-4 w-4" />
          관리자 설정
        </button>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab("ai")}
          className={getTabClass("ai")}
        >
          <Bot className="h-4 w-4" /> AI 질문
        </button>
        <button
          onClick={() => setActiveTab("pipeline")}
          className={getTabClass("pipeline")}
        >
          <Activity className="h-4 w-4" /> 전체 개발 파이프라인
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={getTabClass("review")}
        >
          <GitPullRequest className="h-4 w-4" /> 타임라인 & 플로우차트
        </button>
      </div>

      {activeTab === "ai" && (
        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[620px] flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                AI 어시스턴트에게 질문하기
              </h3>
              <p className="text-xs text-indigo-700/70 mt-1">
                GitHub 데이터와 회의록을 바탕으로, 현재 진행 상황을 맥락 있게
                답변합니다.
              </p>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              실시간 데모
            </span>
          </div>

          <div className="px-5 pt-4 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setChatInput(prompt)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-200 hover:text-indigo-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-indigo-50/30">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {msg.role === "user" ? "PM" : <Bot className="w-5 h-5" />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-900 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="예: 이번 주 내 QA 가능한 기능만 요약해줘"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "pipeline" && (
        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 min-h-[620px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5" /> 전체 개발 파이프라인
            </h3>
            <div className="inline-flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
              <span className="text-sm font-medium text-indigo-900">
                총 진행률
              </span>
              <span className="text-2xl font-bold text-indigo-600">
                {totalProgress}%
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {features.map((feat) => {
              const progress = calculateProgress(feat.tasks);
              const status =
                progress === 100
                  ? "completed"
                  : progress > 0
                    ? "in-progress"
                    : "pending";

              return (
                <article
                  key={feat.id}
                  className={`rounded-2xl border p-4 flex flex-col min-h-[240px] ${
                    status === "completed"
                      ? "bg-gray-50 border-gray-200"
                      : status === "in-progress"
                        ? "bg-white border-indigo-200 ring-2 ring-indigo-50"
                        : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4
                      className={`font-semibold text-sm ${
                        status === "completed"
                          ? "text-gray-500"
                          : "text-gray-800"
                      }`}
                    >
                      {feat.name}
                    </h4>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        status === "completed"
                          ? "bg-green-100 text-green-700"
                          : status === "in-progress"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {status === "completed"
                        ? "완료"
                        : status === "in-progress"
                          ? "진행중"
                          : "대기"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-2xl font-bold text-indigo-600">
                      {progress}%
                    </span>
                    {status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === "completed"
                          ? "bg-green-500"
                          : status === "in-progress"
                            ? "bg-indigo-500"
                            : "bg-gray-300"
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <ul className="mt-4 space-y-2 overflow-y-auto pr-1">
                    {feat.tasks.length === 0 && (
                      <li className="text-xs text-gray-400">
                        등록된 세부 작업 없음
                      </li>
                    )}
                    {feat.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="text-xs flex items-start gap-2"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            task.completed
                              ? "text-gray-400 line-through"
                              : "text-gray-700 leading-relaxed"
                          }
                        >
                          {task.isAiSuggested && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded mr-1">
                              AI
                            </span>
                          )}
                          {task.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "review" && (
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 rounded-3xl border border-gray-200 bg-white shadow-sm flex flex-col h-[620px]">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> 개발팀 피드백 타임라인
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 relative">
              <div className="absolute left-[30px] top-8 bottom-8 w-0.5 bg-gray-100"></div>
              {timelineEvents.map((event) => (
                <div key={event.id} className="relative pl-12">
                  <div
                    className={`absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${
                      event.role === "pm"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    <span className="text-[10px] font-bold">
                      {event.role === "pm" ? "PM" : "DEV"}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {event.role === "pm" ? "나의 요청" : "개발팀 답변"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {event.time}
                      </span>
                    </div>
                    <p className="text-gray-900 text-sm mb-3 leading-relaxed">
                      {event.content}
                    </p>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 text-blue-500 mb-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">
                          AI 기획적 해석
                        </span>
                      </div>
                      <p className="text-gray-700 font-mono text-xs leading-relaxed">
                        {event.aiTranslation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                  placeholder="개발팀에게 전달할 피드백을 작성하세요..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendFeedback}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col h-[620px]">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
              <GitPullRequest className="w-5 h-5" /> AI 요약 플로우차트
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-6">
              <div className="w-full bg-slate-100 text-slate-800 p-3 rounded-lg text-center text-sm shadow-sm border border-slate-200">
                [결제] PortOne 연동 준비 완료
              </div>
              <ArrowDown className="w-5 h-5 text-gray-400" />
              <div className="w-full bg-slate-100 text-slate-800 p-3 rounded-lg text-center text-sm shadow-sm border border-slate-200">
                [결제] 결제 금액 검증 로직 구현됨
              </div>
              <ArrowDown className="w-5 h-5 text-gray-400" />
              <div className="w-full border-2 border-dashed border-blue-400 bg-blue-50 text-blue-900 p-3 rounded-lg text-center text-sm font-medium">
                [결제] 결제 실패/오류 예외 처리 (추가 필요)
              </div>
              <ArrowDown className="w-5 h-5 text-gray-400" />
              <div className="w-full bg-slate-100 text-slate-800 p-3 rounded-lg text-center text-sm shadow-sm border border-slate-200">
                [결제] 결제 상태 DB 반영
              </div>
            </div>

            <div className="mt-auto pt-5 border-t border-gray-100">
              {proposalStatus === "discussing" ? (
                <div className="w-full text-center p-3 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 text-sm font-medium">
                  개발팀의 검토를 대기 중입니다...
                </div>
              ) : proposalStatus === "dev_confirmed" ? (
                <button
                  onClick={handleFinalConfirm}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md animate-pulse"
                >
                  <Check className="w-5 h-5" /> 파이프라인에 최종 반영 승인
                </button>
              ) : (
                <div className="w-full text-center p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> 파이프라인 반영 완료
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
