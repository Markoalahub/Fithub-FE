import { useRef, useState } from "react";
import { ChevronLeft, FileText, FolderOpen, Plus, Upload, X, Zap } from "lucide-react";

export type DemoProject = { id: number; name: string; description: string };
export type PipelineCategoryOption = "FE" | "BE" | "ALL";

interface PipelineLandingProps {
  step: "project-list" | "create-project" | "pipeline-form";
  projects: DemoProject[];
  selectedProject: DemoProject | null;
  isCreatingProject: boolean;
  isGeneratingPipeline: boolean;
  generatingFileName: string | null;
  onSelectProject: (project: DemoProject) => void;
  onGoToCreateProject: () => void;
  onCreateProject: (params: { name: string; description: string }) => Promise<void>;
  onGeneratePipeline: (params: {
    file: File;
    category: PipelineCategoryOption;
    techStack: string;
    requirements: string;
  }) => Promise<void>;
  onCancelCreateProject: () => void;
  onBackToPipelines: () => void;
  onPushToast: (message: string, tone: "success" | "info" | "warning") => void;
}

const CATEGORY_OPTIONS: { value: PipelineCategoryOption; label: string }[] = [
  { value: "FE", label: "FE" },
  { value: "BE", label: "BE" },
  { value: "ALL", label: "FE + BE" },
];

const CATEGORY_DESCRIPTIONS: Record<PipelineCategoryOption, string> = {
  FE: "프론트엔드 파이프라인을 생성합니다",
  BE: "백엔드 파이프라인을 생성합니다",
  ALL: "FE와 BE 파이프라인을 모두 생성합니다",
};

export default function PipelineLanding({
  step,
  projects,
  selectedProject,
  isCreatingProject,
  isGeneratingPipeline,
  generatingFileName,
  onSelectProject,
  onGoToCreateProject,
  onCreateProject,
  onGeneratePipeline,
  onCancelCreateProject,
  onBackToPipelines,
  onPushToast,
}: PipelineLandingProps) {
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");

  const [categoryOption, setCategoryOption] = useState<PipelineCategoryOption>("FE");
  const [techStackInput, setTechStackInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetPdf = (file: File) => {
    if (!(file.type === "application/pdf" || /\.pdf$/i.test(file.name))) {
      onPushToast("PDF 파일만 업로드할 수 있습니다.", "warning");
      return;
    }
    setPdfFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSetPdf(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) validateAndSetPdf(file);
  };

  const handleSubmitCreateProject = async () => {
    const name = nameInput.trim();
    if (!name) {
      onPushToast("프로젝트 이름을 입력해 주세요.", "warning");
      return;
    }
    await onCreateProject({ name, description: descriptionInput.trim() });
  };

  const handleSubmitGeneratePipeline = async () => {
    if (!pdfFile) { onPushToast("PDF 파일을 선택해 주세요.", "warning"); return; }
    if (!techStackInput.trim()) { onPushToast("기술 스택을 입력해 주세요.", "warning"); return; }
    if (!requirementsInput.trim()) { onPushToast("요구사항을 입력해 주세요.", "warning"); return; }
    await onGeneratePipeline({
      file: pdfFile,
      category: categoryOption,
      techStack: techStackInput.trim(),
      requirements: requirementsInput.trim(),
    });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F5F5F5]">

      {/* ── PROJECT LIST ─────────────────────────────────────────── */}
      {step === "project-list" && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">프로젝트</h2>
                <p className="text-xs text-gray-400 mt-0.5">파이프라인을 생성할 프로젝트를 선택하세요</p>
              </div>
              {projects.length > 0 && (
                <button
                  onClick={onGoToCreateProject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> 새 프로젝트
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 flex flex-col items-center text-center shadow-sm">
                <div className="rounded-2xl bg-gray-100 p-4 mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">아직 프로젝트가 없습니다</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  첫 번째 프로젝트를 만들어<br />파이프라인을 시작해 보세요
                </p>
                <button
                  onClick={onGoToCreateProject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-4 w-4" /> 새 프로젝트 만들기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-gray-900 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{project.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-gray-700 shrink-0 transition-colors">
                        선택 →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE PROJECT ──────────────────────────────────────── */}
      {step === "create-project" && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
              <button
                onClick={onCancelCreateProject}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> 프로젝트 목록
              </button>
              <span className="text-gray-200">/</span>
              <span className="font-medium text-gray-900">새 프로젝트</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-gray-100 p-2.5">
                  <FolderOpen className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">새 프로젝트 만들기</h2>
                  <p className="text-xs text-gray-400">프로젝트 정보를 입력해 주세요</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    프로젝트 이름 <span className="text-red-400 normal-case">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing && !isCreatingProject) {
                        void handleSubmitCreateProject();
                      }
                    }}
                    placeholder="예: Fithub 모바일 앱"
                    maxLength={60}
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                    프로젝트 설명
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="프로젝트에 대한 간단한 설명 (선택사항)"
                    maxLength={200}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={onCancelCreateProject}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => void handleSubmitCreateProject()}
                  disabled={isCreatingProject || !nameInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                  {isCreatingProject ? "생성 중..." : "프로젝트 생성"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIPELINE FORM ───────────────────────────────────────── */}
      {step === "pipeline-form" && (
        <div className="flex flex-1 items-start justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
              <button
                onClick={onBackToPipelines}
                className="flex items-center gap-1 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> 프로젝트 목록
              </button>
              <span className="text-gray-200">/</span>
              <span className="text-gray-600">{selectedProject?.name ?? "프로젝트"}</span>
              <span className="text-gray-200">/</span>
              <span className="font-medium text-gray-900">파이프라인 생성</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-gray-100 p-2.5">
                  <Zap className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">파이프라인 생성</h2>
                  <p className="text-xs text-gray-400">PRD · 기획서 PDF를 업로드하면 AI가 파이프라인을 자동 생성합니다</p>
                </div>
              </div>

              {isGeneratingPipeline ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="mb-5 h-9 w-9 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                  <p className="text-sm font-semibold text-gray-900">AI가 파이프라인을 분석하고 있습니다</p>
                  {generatingFileName && (
                    <p className="mt-1.5 max-w-[260px] truncate text-xs text-gray-400">{generatingFileName}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">잠시만 기다려 주세요...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* PDF Drop Zone */}
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      PRD / 기획서 PDF <span className="normal-case text-red-400">*</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <div
                      ref={dropZoneRef}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                        isDragOver
                          ? "border-gray-900 bg-gray-50"
                          : pdfFile
                            ? "border-indigo-300 bg-indigo-50/40"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/60"
                      }`}
                    >
                      {pdfFile ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-indigo-500" />
                          <span className="max-w-[240px] truncate text-sm font-medium text-gray-900">
                            {pdfFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                            className="ml-1 shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : isDragOver ? (
                        <p className="text-sm font-semibold text-gray-900">PDF를 여기에 놓으세요</p>
                      ) : (
                        <>
                          <Upload className="mb-2 h-6 w-6 text-gray-300" />
                          <p className="text-xs text-gray-500">PDF를 끌어다 놓거나 클릭하여 선택</p>
                          <p className="mt-1 text-[10px] text-gray-300">기획서, PRD 문서 지원</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      카테고리
                    </label>
                    <div className="flex gap-2">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCategoryOption(opt.value)}
                          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${
                            categoryOption === opt.value
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-400">
                      {CATEGORY_DESCRIPTIONS[categoryOption]}
                    </p>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      기술 스택 <span className="normal-case text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      placeholder="예: React, TypeScript, Node.js, PostgreSQL"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      주요 요구사항 <span className="normal-case text-red-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={requirementsInput}
                      onChange={(e) => setRequirementsInput(e.target.value)}
                      placeholder="핵심 기능 및 요구사항을 간략히 입력해 주세요"
                      className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSubmitGeneratePipeline()}
                    disabled={!pdfFile || !techStackInput.trim() || !requirementsInput.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                  >
                    <Zap className="h-4 w-4" />
                    파이프라인 생성
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
