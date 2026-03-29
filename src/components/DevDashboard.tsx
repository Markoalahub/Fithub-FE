import React, { useState } from 'react';
import { Github, MessageSquare, ArrowRightLeft, Check, Activity, CheckCircle2, ArrowRight, Sparkles, ArrowDown, Send, GitPullRequest } from 'lucide-react';
import { Feature, TimelineMessage } from '../App';

interface DevDashboardProps {
  features: Feature[];
  setFeatures: React.Dispatch<React.SetStateAction<Feature[]>>;
  timelineEvents: TimelineMessage[];
  setTimelineEvents: React.Dispatch<React.SetStateAction<TimelineMessage[]>>;
  proposalStatus: 'discussing' | 'dev_confirmed' | 'pm_confirmed';
  setProposalStatus: React.Dispatch<React.SetStateAction<'discussing' | 'dev_confirmed' | 'pm_confirmed'>>;
}

export default function DevDashboard({ features, setFeatures, timelineEvents, setTimelineEvents, proposalStatus, setProposalStatus }: DevDashboardProps) {
  const [isGithubConnected, setIsGithubConnected] = useState(true);
  const [replyInput, setReplyInput] = useState('');

  const calculateProgress = (tasks: Feature['tasks']) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const totalCompletedTasks = features.reduce((acc, f) => acc + f.tasks.filter(t => t.completed).length, 0);
  const totalTasks = features.reduce((acc, f) => acc + f.tasks.length, 0);
  const totalProgress = totalTasks === 0 ? 0 : Math.round((totalCompletedTasks / totalTasks) * 100);

  const toggleTask = (featureId: number, taskId: string) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      return {
        ...f,
        tasks: f.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      };
    }));
  };

  const suggestGithubTasks = (featureId: number) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const newTaskId = `${f.id}-${Date.now()}`;
      return {
        ...f,
        tasks: [...f.tasks, { 
          id: newTaskId, 
          title: `[AI 추천] GitHub Issue #${Math.floor(Math.random() * 100) + 10} 연동 작업`, 
          completed: false, 
          isAiSuggested: true 
        }]
      };
    }));
  };

  const handleSendReply = () => {
    if (!replyInput.trim()) return;
    const newMessage: TimelineMessage = {
      id: Date.now().toString(),
      role: 'dev',
      content: replyInput,
      aiTranslation: `[AI 요약] ${replyInput.substring(0, 20)}... 관련 기술적 검토 및 일정 공유.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTimelineEvents([...timelineEvents, newMessage]);
    setReplyInput('');
  };

  const handleFinalConfirm = () => {
    setProposalStatus('dev_confirmed');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">개발자 대시보드</h2>
          <p className="text-gray-500 mt-1">기획자의 의도를 기술적으로 파악하고 피드백을 남기세요.</p>
        </div>
        <button 
          onClick={() => setIsGithubConnected(!isGithubConnected)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isGithubConnected 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          <Github className="w-4 h-4" />
          {isGithubConnected ? 'GitHub 연동됨' : 'GitHub 연동하기'}
        </button>
      </header>

      {/* 1. Feature Progress Pipeline (Interactive for Devs) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5" /> 전체 개발 파이프라인 (동기화됨)
          </h3>
          <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <span className="text-sm font-medium text-indigo-900">총 진행률</span>
            <span className="text-2xl font-bold text-indigo-600">{totalProgress}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-2 px-2">
          {features.map((feat, idx) => {
            const progress = calculateProgress(feat.tasks);
            const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending';
            
            return (
              <React.Fragment key={feat.id}>
                <div className={`flex-shrink-0 w-80 p-4 rounded-xl border transition-all flex flex-col h-72 ${
                  status === 'completed' 
                    ? 'bg-gray-50 border-gray-200' 
                    : status === 'in-progress' 
                      ? 'bg-white border-indigo-300 shadow-md ring-2 ring-indigo-50' 
                      : 'bg-white border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className={`font-medium text-sm truncate ${status === 'completed' ? 'text-gray-500' : 'text-gray-800'}`}>
                      {feat.name}
                    </h4>
                    <button 
                      onClick={() => suggestGithubTasks(feat.id)}
                      className="text-[10px] flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                      title="GitHub 이슈 기반 작업 추천"
                    >
                      <Sparkles className="w-3 h-3" /> 추천
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <span className={`text-2xl font-bold ${status === 'completed' ? 'text-gray-500' : status === 'in-progress' ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {progress}%
                    </span>
                    {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 mb-4">
                    <div className={`h-1.5 rounded-full ${status === 'completed' ? 'bg-green-500' : status === 'in-progress' ? 'bg-indigo-500' : 'bg-gray-300'}`} style={{ width: `${progress}%` }}></div>
                  </div>
                  
                  {/* Interactive Task List */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {feat.tasks.map(task => (
                      <label key={task.id} className="flex items-start gap-2 text-xs cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => toggleTask(feat.id, task.id)}
                          className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={`flex-1 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {task.isAiSuggested && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded mr-1">AI</span>}
                          {task.title}
                        </span>
                      </label>
                    ))}
                    {feat.tasks.length === 0 && <span className="text-xs text-gray-400">등록된 세부 작업 없음</span>}
                  </div>
                </div>
                {idx < features.length - 1 && <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. PM Questions & Feedback Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5" /> 기획자 피드백 타임라인
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="relative pl-10">
                {/* Timeline Dot */}
                <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${
                  event.role === 'pm' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <span className="text-[10px] font-bold">{event.role === 'pm' ? 'PM' : 'DEV'}</span>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {event.role === 'pm' ? '기획자 요청' : '개발자 답변'}
                    </span>
                    <span className="text-xs text-gray-400">{event.time}</span>
                  </div>
                  <p className="text-gray-900 text-sm mb-3">{event.content}</p>
                  
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-indigo-500 mb-1">
                      <ArrowRightLeft className="w-3 h-3" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">AI 기술적 해석</span>
                    </div>
                    <p className="text-gray-700 font-mono text-xs leading-relaxed">
                      {event.aiTranslation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Input */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="기획자에게 전달할 피드백을 작성하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              <button 
                onClick={handleSendReply}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Flowchart & Confirm */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <GitPullRequest className="w-5 h-5" /> AI 요약 플로우차트 (개발자용)
          </h3>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-8">
            <div className="w-full bg-slate-800 text-white p-3 rounded-lg text-center text-sm shadow-sm">
              [API] PortOne Webhook 수신 엔드포인트 생성
            </div>
            <ArrowDown className="w-5 h-5 text-gray-400" />
            <div className="w-full bg-slate-800 text-white p-3 rounded-lg text-center text-sm shadow-sm">
              [Logic] 결제 금액 및 위변조 검증
            </div>
            <ArrowDown className="w-5 h-5 text-gray-400" />
            <div className="w-full border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-900 p-3 rounded-lg text-center text-sm font-medium">
              [Logic] 결제 실패/오류 예외 처리 (추가 필요)
            </div>
            <ArrowDown className="w-5 h-5 text-gray-400" />
            <div className="w-full bg-slate-800 text-white p-3 rounded-lg text-center text-sm shadow-sm">
              [DB] 결제 상태 업데이트 트랜잭션
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            {proposalStatus === 'discussing' ? (
              <button 
                onClick={handleFinalConfirm}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
              >
                <Check className="w-5 h-5" /> 최종 Confirm (기획자에게 전달)
              </button>
            ) : proposalStatus === 'dev_confirmed' ? (
              <div className="w-full text-center p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-sm font-medium">
                기획자의 최종 승인을 대기 중입니다...
              </div>
            ) : (
              <div className="w-full text-center p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 기획자 승인 완료 (파이프라인 반영됨)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
