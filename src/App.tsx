import { useState } from 'react';
import PMDashboard from './components/PMDashboard';
import DevDashboard from './components/DevDashboard';
import AdminDashboard from './components/AdminDashboard';
import { MessageSquare } from 'lucide-react';
import appConfig from '@/app.config';

export type Task = { id: string; title: string; completed: boolean; isAiSuggested?: boolean };
export type Feature = { id: number; name: string; tasks: Task[] };

export type TimelineMessage = {
  id: string;
  role: 'pm' | 'dev';
  content: string;
  aiTranslation: string;
  time: string;
};

const initialFeatures: Feature[] = [
  {
    id: 1, name: '소셜 로그인 연동',
    tasks: [
      { id: '1-1', title: '카카오 API 키 발급', completed: true },
      { id: '1-2', title: 'OAuth 콜백 라우트 구현', completed: true },
      { id: '1-3', title: 'DB 유저 정보 연동', completed: true },
    ]
  },
  {
    id: 2, name: '결제 모듈 연동',
    tasks: [
      { id: '2-1', title: 'PortOne SDK 설치', completed: true },
      { id: '2-2', title: '결제창 호출 UI 구현', completed: true },
      { id: '2-3', title: 'Webhook 검증 로직 작성', completed: false },
    ]
  },
  {
    id: 3, name: '관리자 통계 페이지',
    tasks: [
      { id: '3-1', title: '일별 매출 집계 쿼리', completed: false },
      { id: '3-2', title: '차트 UI 컴포넌트 개발', completed: false },
    ]
  },
  {
    id: 4, name: '알림 시스템 구축',
    tasks: []
  },
  {
    id: 5, name: '검색 최적화',
    tasks: []
  }
];

const initialTimeline: TimelineMessage[] = [
  {
    id: '1',
    role: 'pm',
    content: '결제 기능 언제 되나요? 테스트 해보고 싶은데요. 예외 처리도 꼼꼼히 부탁드려요.',
    aiTranslation: '결제 API 연동 완료 일정 문의. Staging 환경 E2E 테스트 가능 시점 확인 및 결제 실패 예외 처리 로직 구현 요청.',
    time: '10:00 AM'
  },
  {
    id: '2',
    role: 'dev',
    content: 'Webhook 검증 로직 작성 중입니다. 예외 처리(결제 실패, 금액 불일치 등) 로직 추가 후 내일 오후에 Staging 배포하겠습니다.',
    aiTranslation: '결제 실패 및 금액 불일치 예외 처리 로직 구현 후 내일 오후 Staging 배포 예정. 이후 테스트 가능.',
    time: '10:30 AM'
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('pm');
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [timelineEvents, setTimelineEvents] = useState<TimelineMessage[]>(initialTimeline);
  const [proposalStatus, setProposalStatus] = useState<'discussing' | 'dev_confirmed' | 'pm_confirmed'>('discussing');

  const tabs = [
    { id: 'pm', label: '기획자 대시보드' },
    { id: 'dev', label: '개발자 대시보드' },
    { id: 'admin', label: '관리자 설정' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">{appConfig.name}</h1>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-full">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                currentView === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
          U
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        {currentView === 'pm' && (
          <PMDashboard 
            features={features} 
            setFeatures={setFeatures}
            timelineEvents={timelineEvents}
            setTimelineEvents={setTimelineEvents}
            proposalStatus={proposalStatus}
            setProposalStatus={setProposalStatus}
          />
        )}
        {currentView === 'dev' && (
          <DevDashboard 
            features={features} 
            setFeatures={setFeatures}
            timelineEvents={timelineEvents}
            setTimelineEvents={setTimelineEvents}
            proposalStatus={proposalStatus}
            setProposalStatus={setProposalStatus}
          />
        )}
        {currentView === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}
