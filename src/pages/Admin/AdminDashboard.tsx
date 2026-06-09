import { useRef } from "react";
import { FileText, UploadCloud } from "lucide-react";
import type { ChangeEvent } from "react";
import type { KnowledgeDocument } from "../../types/index";

interface AdminDashboardProps {
  knowledgeDocs: KnowledgeDocument[];
  isGeneratingPipeline: boolean;
  onUploadKnowledgePdf: (file: File) => Promise<void>;
}

export default function AdminDashboard({
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
