import { useRef } from "react";
import { FileText, FolderGit2, Plus, UploadCloud, Users } from "lucide-react";
import type { ChangeEvent } from "react";
import type { KnowledgeDocument } from "../../types/index";

interface AdminDashboardProps {
  section: "knowledge" | "project" | "team";
  knowledgeDocs: KnowledgeDocument[];
  isGeneratingPipeline: boolean;
  onUploadKnowledgePdf: (file: File) => Promise<void>;
}

const mockMembers = [
  {
    name: "김기획",
    role: "Product Manager",
    email: "pm@example.com",
    type: "기획자",
  },
  {
    name: "이개발",
    role: "Frontend Engineer",
    email: "fe@example.com",
    type: "개발자",
  },
  {
    name: "박서버",
    role: "Backend Engineer",
    email: "be@example.com",
    type: "개발자",
  },
];

export default function AdminDashboard({
  section,
  knowledgeDocs,
  isGeneratingPipeline,
  onUploadKnowledgePdf,
}: AdminDashboardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    if (isGeneratingPipeline) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    void onUploadKnowledgePdf(selectedFile);
  };

  if (section === "knowledge") {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px]">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <UploadCloud className="w-5 h-5" /> AI 지식 베이스
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          기획서, 회의록 등을 업로드하면 AI가 이를 학습하여 더 정확한 답변을
          제공합니다.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isGeneratingPipeline}
        />

        <button
          type="button"
          onClick={openFilePicker}
          disabled={isGeneratingPipeline}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer mb-6 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-white"
        >
          <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {isGeneratingPipeline
              ? "PDF 분석 중입니다. 잠시만 기다려 주세요"
              : "클릭해서 PRD(PDF) 업로드"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF 지원 (최대 50MB)
          </p>
        </button>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            학습된 문서
          </h4>

          {knowledgeDocs.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
              업로드된 문서가 없습니다. PDF를 올리면 AI 파이프라인 생성에 사용됩니다.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <FileText className="w-5 h-5 text-indigo-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.uploadedAt} · {doc.sizeLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section === "project") {
    return (
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5" /> 프로젝트 설정
          </h3>
          <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">
            수정
          </button>
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
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm min-h-[620px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5" /> 팀원 관리
        </h3>
        <button className="flex items-center gap-1 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">
          <Plus className="w-4 h-4" /> 초대
        </button>
      </div>

      <div className="space-y-3">
        {mockMembers.map((member) => (
          <div
            key={member.email}
            className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                {member.name[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {member.name}
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    {member.email}
                  </span>
                </p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                member.type === "기획자"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {member.type}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
