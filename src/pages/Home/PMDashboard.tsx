import React, { useState } from "react";
import {
  Github,
  Activity,
  CheckCircle2,
  AlertCircle,
  Send,
  Bot,
  User,
  ArrowRight,
  MessageSquare,
  ArrowRightLeft,
  GitPullRequest,
  ArrowDown,
  Check,
} from "lucide-react";
import type { Feature, TimelineMessage } from "../../types";

interface PMDashboardProps {
  features: Feature[];
  setFeatures: React.Dispatch<React.SetStateAction<Feature[]>>;
  timelineEvents: TimelineMessage[];
  setTimelineEvents: React.Dispatch<React.SetStateAction<TimelineMessage[]>>;
  proposalStatus: "discussing" | "dev_confirmed" | "pm_confirmed";
  setProposalStatus: React.Dispatch<
    React.SetStateAction<"discussing" | "dev_confirmed" | "pm_confirmed">
  >;
}

export default function PMDashboard({
  features,
  setFeatures,
  timelineEvents,
  setTimelineEvents,
  proposalStatus,
  setProposalStatus,
}: PMDashboardProps) {
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
    setChatHistory([...chatHistory, { role: "user", content: chatInput }]);
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
    }, 1000);
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
    setTimelineEvents([...timelineEvents, newMessage]);
    setFeedbackInput("");
  };

  const handleFinalConfirm = () => {
    setProposalStatus("pm_confirmed");
    // Add the new task to the feature pipeline
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id === 2) {
          // 결제 모듈 연동
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
        }
        return f;
      }),
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">기획자 대시보드</h2>
        <p className="text-gray-500 mt-1">
          프로젝트 현황을 파악하고 개발팀과 소통하세요.
        </p>
      </header>

      {/* 1. AI Chat (Communication Feature at the Top) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[350px]">
        <div className="p-4 border-b border-gray-100 bg-indigo-50/50 rounded-t-2xl flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              AI 어시스턴트에게 질문하기
            </h3>
            <p className="text-xs text-indigo-600/70 mt-1">
              GitHub 데이터와 회의록을 기반으로 개발 현황을 답변해 드립니다.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-gray-200"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5 text-gray-600" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div
                className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                  msg.role === "user"
                    ? "bg-gray-900 text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="예: 지난 회의에서 보류된 기능이 뭐였죠?"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Feature Progress Pipeline */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5" /> 전체 개발 파이프라인
          </h3>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <span className="text-sm font-medium text-indigo-900">
              총 진행률
            </span>
            <span className="text-2xl font-bold text-indigo-600">
              {totalProgress}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 px-2">
          {features.map((feat, idx) => {
            const progress = calculateProgress(feat.tasks);
            const status =
              progress === 100
                ? "completed"
                : progress > 0
                  ? "in-progress"
                  : "pending";

            return (
              <React.Fragment key={feat.id}>
                <div
                  className={`flex-shrink-0 w-72 p-4 rounded-xl border transition-all flex flex-col h-64 ${
                    status === "completed"
                      ? "bg-gray-50 border-gray-200 opacity-70"
                      : status === "in-progress"
                        ? "bg-white border-indigo-300 shadow-md ring-2 ring-indigo-50 scale-105"
                        : "bg-white border-gray-200"
                  }`}
                >
                  <h4
                    className={`font-medium text-sm mb-3 truncate ${status === "completed" ? "text-gray-500 line-through" : "text-gray-800"}`}
                  >
                    {feat.name}
                  </h4>
                  <div className="flex justify-between items-end">
                    <span
                      className={`text-2xl font-bold ${status === "completed" ? "text-gray-500" : status === "in-progress" ? "text-indigo-600" : "text-gray-400"}`}
                    >
                      {progress}%
                    </span>
                    {status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 mb-4">
                    <div
                      className={`h-1.5 rounded-full ${status === "completed" ? "bg-green-500" : status === "in-progress" ? "bg-indigo-500" : "bg-gray-300"}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  {/* Task List (Read-only for PM) */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {feat.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={
                            task.completed
                              ? "text-gray-400 line-through"
                              : "text-gray-700"
                          }
                        >
                          {task.isAiSuggested && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded mr-1">
                              AI
                            </span>
                          )}
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {feat.tasks.length === 0 && (
                      <span className="text-xs text-gray-400">
                        등록된 세부 작업 없음
                      </span>
                    )}
                  </div>
                </div>
                {idx < features.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Developer Feedback Timeline & AI Flowchart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5" /> 개발팀 피드백 타임라인
          </h3>

          <div className="flex-1 overflow-y-auto pr-4 space-y-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline Dot */}
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
                    <span className="text-xs text-gray-400">{event.time}</span>
                  </div>
                  <p className="text-gray-900 text-sm mb-3">{event.content}</p>

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

          {/* Feedback Input */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendFeedback()}
                placeholder="개발팀에게 전달할 피드백을 작성하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendFeedback}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Flowchart & Confirm */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <GitPullRequest className="w-5 h-5" /> AI 요약 플로우차트 (기획자용)
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-8">
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

          <div className="mt-auto pt-6 border-t border-gray-100">
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
      </div>
    </div>
  );
}
