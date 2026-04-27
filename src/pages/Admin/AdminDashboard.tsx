import { useMemo, useRef, useState } from "react";
import { FileText, Plus, UploadCloud, Users } from "lucide-react";
import type { ChangeEvent } from "react";
import type { KnowledgeDocument } from "../../types/index";

interface AdminDashboardProps {
  section: "knowledge" | "team";
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
    discipline: "pm",
  },
  {
    name: "이프론트",
    role: "Frontend Engineer",
    email: "fe@example.com",
    type: "프론트엔드 개발자",
    discipline: "frontend",
  },
  {
    name: "박백엔드",
    role: "Backend Engineer",
    email: "be@example.com",
    type: "백엔드 개발자",
    discipline: "backend",
  },
] as const;

export default function AdminDashboard({
  section,
  knowledgeDocs,
  isGeneratingPipeline,
  onUploadKnowledgePdf,
}: AdminDashboardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDeveloperSection, setSelectedDeveloperSection] = useState<
    "frontend" | "backend"
  >("frontend");

  const frontendMembers = useMemo(
    () => mockMembers.filter((member) => member.discipline === "frontend"),
    [],
  );

  const backendMembers = useMemo(
    () => mockMembers.filter((member) => member.discipline === "backend"),
    [],
  );

  const selectedMembers =
    selectedDeveloperSection === "frontend" ? frontendMembers : backendMembers;

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
      <section className="rounded-2xl border border-gray-200 bg-white p-8 min-h-[620px]">
        <div className="pb-6 mb-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-gray-400" /> AI 지식 베이스
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            기획서, 회의록 등을 업로드하면 AI가 이를 학습하여 더 정확한 답변을 제공합니다.
          </p>
        </div>

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
          className="w-full border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer mb-8 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white"
        >
          <UploadCloud className="w-7 h-7 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {isGeneratingPipeline
              ? "PDF 분석 중입니다. 잠시만 기다려 주세요"
              : "클릭해서 PRD(PDF) 업로드"}
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF 지원 (최대 50MB)</p>
        </button>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            학습된 문서
          </h4>

          {knowledgeDocs.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
              업로드된 문서가 없습니다. PDF를 올리면 AI 파이프라인 생성에 사용됩니다.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {knowledgeDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-400">
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

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 min-h-[620px]">
      <div className="pb-6 mb-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" /> 팀원 관리
        </h3>
        <button className="inline-flex items-center gap-1.5 text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">
          <Plus className="w-3.5 h-3.5" /> 초대
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">기획자</p>
        {mockMembers
          .filter((member) => member.discipline === "pm")
          .map((member) => (
            <div
              key={member.email}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm">
                  {member.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.name}
                    <span className="text-xs font-normal text-gray-400 ml-1.5">
                      {member.email}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">{member.role}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                {member.type}
              </span>
            </div>
          ))}
      </div>

      <div className="mb-5 flex items-center border-b border-gray-100">
        <button
          onClick={() => setSelectedDeveloperSection("frontend")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            selectedDeveloperSection === "frontend"
              ? "border-gray-900 text-gray-900 font-semibold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          프론트엔드
        </button>
        <button
          onClick={() => setSelectedDeveloperSection("backend")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            selectedDeveloperSection === "backend"
              ? "border-gray-900 text-gray-900 font-semibold"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          백엔드
        </button>
      </div>

      <div className="space-y-2">
        {selectedMembers.map((member) => (
          <div
            key={member.email}
            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm">
                {member.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.name}
                  <span className="text-xs font-normal text-gray-400 ml-1.5">
                    {member.email}
                  </span>
                </p>
                <p className="text-xs text-gray-400">{member.role}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
              {member.type}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
