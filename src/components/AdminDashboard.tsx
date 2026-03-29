import { Users, FolderGit2, UploadCloud, Plus, FileText } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">관리자 설정</h2>
        <p className="text-gray-500 mt-1">프로젝트, 팀원, 그리고 AI 학습 자료를 관리합니다.</p>
      </header>

      {/* 1. Knowledge Base (Communication/AI Feature at the Top) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <UploadCloud className="w-5 h-5" /> AI 지식 베이스
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          기획서, 회의록 등을 업로드하면 AI가 이를 학습하여 더 정확한 답변을 제공합니다.
        </p>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-6">
          <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">클릭하거나 파일을 드래그하여 업로드</p>
          <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT 지원 (최대 50MB)</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">학습된 문서</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'v1.0_요구사항_정의서.pdf', date: '2023.10.01' },
              { name: '10월_1주차_주간회의록.docx', date: '2023.10.05' },
            ].map((doc, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <FileText className="w-5 h-5 text-indigo-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project & Team */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5" /> 프로젝트 설정
            </h3>
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">수정</button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">프로젝트 이름</p>
              <p className="font-medium text-gray-900">Fithub V1</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">연결된 GitHub 저장소</p>
              <p className="font-medium text-gray-900">team-alpha/fithub-web</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5" /> 팀원 관리
            </h3>
            <button className="flex items-center gap-1 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">
              <Plus className="w-4 h-4" /> 초대
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { name: '김기획', role: 'Product Manager', email: 'pm@example.com', type: '기획자' },
              { name: '이개발', role: 'Frontend Engineer', email: 'fe@example.com', type: '개발자' },
              { name: '박서버', role: 'Backend Engineer', email: 'be@example.com', type: '개발자' },
            ].map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name} <span className="text-xs font-normal text-gray-500 ml-1">{member.email}</span></p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                  member.type === '기획자' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {member.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
