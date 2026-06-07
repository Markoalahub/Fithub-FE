import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  GitBranch,
  Layers,
  Pencil,
  Plus,
  Save,
  Server,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import type {
  PipelineGenerationCategory,
  ProjectDetail,
  ProjectPipelineSummary,
} from "../services/api";

export type DemoProject = {
  id: number;
  name: string;
  description: string;
  creatorId?: number;
  creatorNickname?: string;
  createdAt?: string;
  updatedAt?: string;
};
export type PipelineCategoryOption = "FE" | "BE" | "ALL";

interface PipelineLandingProps {
  step: "project-list" | "project-detail" | "create-project" | "pipeline-form";
  projects: DemoProject[];
  selectedProject: DemoProject | null;
  projectDetail: ProjectDetail | null;
  pipelineSummaries: ProjectPipelineSummary[];
  isCreatingProject: boolean;
  isFetchingProjects: boolean;
  isFetchingProjectDetail: boolean;
  isFetchingProjectPipelines: boolean;
  isUpdatingProject: boolean;
  deletingProjectId: number | null;
  isGeneratingPipeline: boolean;
  generatingFileName: string | null;
  aiPipelineGenerationRemainingCount?: number;
  pipelineEmptyMessage: string | null;
  canCreateProject: boolean;
  canDeleteProject: boolean;
  canInviteProject: boolean;
  canUpdateProject: boolean;
  onSelectProject: (project: DemoProject) => void;
  onGoToCreateProject: () => void;
  onGoToPipelineForm: () => void;
  onCreateProject: (params: { name: string; description: string }) => Promise<void>;
  onUpdateProject: (params: { name: string; description: string }) => Promise<void>;
  onRequestDeleteProject: (project: DemoProject) => void;
  onOpenProjectInvite: () => void;
  onViewPipeline: (category: PipelineGenerationCategory) => Promise<void>;
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

const CATEGORY_OPTIONS: {
  value: PipelineCategoryOption;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { value: "FE", label: "FE", description: "프론트엔드", Icon: ({ className }) => <Layers className={className} /> },
  { value: "BE", label: "BE", description: "백엔드", Icon: ({ className }) => <Server className={className} /> },
  {
    value: "ALL",
    label: "ALL",
    description: "FE + BE",
    Icon: ({ className }) => <Zap className={className} />,
  },
];

export default function PipelineLanding({
  step,
  projects,
  selectedProject,
  projectDetail,
  pipelineSummaries,
  isCreatingProject,
  isFetchingProjects,
  isFetchingProjectDetail,
  isFetchingProjectPipelines,
  isUpdatingProject,
  deletingProjectId,
  isGeneratingPipeline,
  generatingFileName,
  aiPipelineGenerationRemainingCount,
  pipelineEmptyMessage,
  canCreateProject,
  canDeleteProject,
  canInviteProject,
  canUpdateProject,
  onSelectProject,
  onGoToCreateProject,
  onGoToPipelineForm,
  onCreateProject,
  onUpdateProject,
  onRequestDeleteProject,
  onOpenProjectInvite,
  onViewPipeline,
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
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editNameInput, setEditNameInput] = useState("");
  const [editDescriptionInput, setEditDescriptionInput] = useState("");

  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remainingCount = aiPipelineGenerationRemainingCount;
  const hasNoAiCalls = remainingCount !== undefined && remainingCount <= 0;

  useEffect(() => {
    setEditNameInput(projectDetail?.projectName ?? selectedProject?.name ?? "");
    setEditDescriptionInput(
      projectDetail?.projectDescription ?? selectedProject?.description ?? "",
    );
    setIsEditingProject(false);
  }, [
    projectDetail?.projectDescription,
    projectDetail?.projectId,
    projectDetail?.projectName,
    selectedProject?.description,
    selectedProject?.id,
    selectedProject?.name,
  ]);

  const validateAndSetPdf = (file: File) => {
    if (!(file.type === "application/pdf" || /\.pdf$/i.test(file.name))) {
      onPushToast("PDF 파일만 업로드할 수 있습니다.", "warning");
      return;
    }
    setPdfFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
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
    if (!name) { onPushToast("프로젝트 이름을 입력해 주세요.", "warning"); return; }
    await onCreateProject({ name, description: descriptionInput.trim() });
  };

  const handleSubmitUpdateProject = async () => {
    const name = editNameInput.trim();
    if (!name) { onPushToast("프로젝트 이름을 입력해 주세요.", "warning"); return; }
    await onUpdateProject({ name, description: editDescriptionInput.trim() });
    setIsEditingProject(false);
  };

  const handleSubmitGeneratePipeline = async () => {
    if (hasNoAiCalls) { onPushToast("AI 파이프라인 생성 가능 횟수가 없습니다.", "warning"); return; }
    if (!pdfFile) { onPushToast("PDF 파일을 선택해 주세요.", "warning"); return; }
    if (!techStackInput.trim()) { onPushToast("기술 스택을 입력해 주세요.", "warning"); return; }
    if (!requirementsInput.trim()) { onPushToast("요구사항을 입력해 주세요.", "warning"); return; }
    await onGeneratePipeline({ file: pdfFile, category: categoryOption, techStack: techStackInput.trim(), requirements: requirementsInput.trim() });
  };

  const projectListDescription = canCreateProject
    ? "파이프라인을 생성할 프로젝트를 선택하세요"
    : "참여 중인 프로젝트를 선택하세요";
  const emptyTitle = canCreateProject
    ? "아직 프로젝트가 없습니다"
    : "참여 중인 프로젝트가 없습니다";
  const emptyDescription = canCreateProject
    ? (
        <>
          첫 번째 프로젝트를 만들고<br />AI 파이프라인을 시작해 보세요
        </>
      )
    : (
        <>
          기획자가 초대한 프로젝트가<br />여기에 표시됩니다
        </>
      );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F5F5F5]">

      {/* ── PROJECT LIST ─────────────────────────────────────────── */}
      {step === "project-list" && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-xl">
            <div className="flex items-end justify-between mb-6 auth-fade-up">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Fithub</p>
                <h2 className="text-xl font-bold text-gray-900">프로젝트</h2>
                <p className="text-sm text-gray-400 mt-0.5">{projectListDescription}</p>
              </div>
              {canCreateProject && projects.length > 0 && (
                <button
                  onClick={onGoToCreateProject}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> 새 프로젝트
                </button>
              )}
            </div>

            {isFetchingProjects ? (
              <div className="rounded-2xl border border-[#E5E5E5] bg-white p-12 text-center shadow-sm auth-fade-up auth-delay-1">
                <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                <h3 className="text-base font-bold text-gray-900 mb-1.5">프로젝트를 불러오는 중입니다</h3>
                <p className="text-sm text-gray-400">참여 중인 프로젝트 목록을 조회하고 있습니다.</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-[#E5E5E5] bg-white p-12 flex flex-col items-center text-center shadow-sm auth-fade-up auth-delay-1">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 mb-5 shadow-inner">
                  <FolderOpen className="h-9 w-9 text-indigo-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{emptyTitle}</h3>
                <p className="text-sm text-gray-400 mb-7 leading-relaxed">
                  {emptyDescription}
                </p>
                {canCreateProject && (
                  <button
                    onClick={onGoToCreateProject}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" /> 새 프로젝트 만들기
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 auth-fade-up auth-delay-1">
                {projects.map((project, i) => {
                  const isDeleting = deletingProjectId === project.id;

                  return (
                    <div
                      key={project.id}
                      style={{ animationDelay: `${120 + i * 60}ms` }}
                      className="flex w-full items-center gap-3 rounded-xl border border-[#E5E5E5] bg-white px-4 py-3.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/60 transition-all group auth-fade-up"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectProject(project)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-indigo-50 transition-colors">
                          <FolderOpen className="h-4.5 w-4.5 text-gray-400 group-hover:text-indigo-500 transition-colors" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{project.description}</p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                      </button>
                      {canDeleteProject && (
                        <button
                          type="button"
                          aria-label={`${project.name} 삭제`}
                          disabled={isDeleting}
                          onClick={() => onRequestDeleteProject(project)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROJECT DETAIL ──────────────────────────────────────── */}
      {step === "project-detail" && (
        <div className="flex flex-1 items-start justify-center p-8">
          <div className="w-full max-w-3xl">
            <div className="mb-5 flex items-center justify-between gap-3 auth-fade-up">
              <button
                onClick={onBackToPipelines}
                className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> 프로젝트 목록으로
              </button>
              {canInviteProject && (
                <button
                  type="button"
                  onClick={onOpenProjectInvite}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <UserPlus className="h-3.5 w-3.5" /> 팀원 초대
                </button>
              )}
            </div>

            {isFetchingProjectDetail ? (
              <div className="rounded-2xl border border-[#E5E5E5] bg-white p-12 text-center shadow-sm auth-fade-up auth-delay-1">
                <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                <h3 className="text-base font-bold text-gray-900 mb-1.5">프로젝트 상세 정보를 불러오는 중입니다</h3>
                <p className="text-sm text-gray-400">참여 인원과 파이프라인 정보를 확인하고 있습니다.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm auth-fade-up auth-delay-1">
                  <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#F0F0F0] pb-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                        Project Detail
                      </p>
                      {isEditingProject ? (
                        <input
                          value={editNameInput}
                          onChange={(e) => setEditNameInput(e.target.value)}
                          className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-base font-bold text-gray-900 focus:border-gray-900 focus:outline-none"
                          maxLength={60}
                        />
                      ) : (
                        <h2 className="truncate text-xl font-bold text-gray-900">
                          {projectDetail?.projectName ?? selectedProject?.name ?? "프로젝트"}
                        </h2>
                      )}
                    </div>
                    {canUpdateProject && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProject((prev) => !prev)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E5E5E5] px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        {isEditingProject ? (
                          <>
                            <X className="h-3.5 w-3.5" /> 취소
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3.5 w-3.5" /> 프로젝트 수정
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        설명
                      </p>
                      {isEditingProject ? (
                        <textarea
                          rows={4}
                          value={editDescriptionInput}
                          onChange={(e) => setEditDescriptionInput(e.target.value)}
                          className="w-full resize-none rounded-lg border border-[#E5E5E5] px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                          maxLength={200}
                        />
                      ) : (
                        <p className="min-h-[44px] rounded-lg bg-gray-50 px-3 py-2.5 text-sm leading-relaxed text-gray-600">
                          {projectDetail?.projectDescription?.trim() ||
                            selectedProject?.description?.trim() ||
                            "프로젝트 설명이 없습니다."}
                        </p>
                      )}
                    </div>

                    {isEditingProject && (
                      <button
                        type="button"
                        onClick={() => void handleSubmitUpdateProject()}
                        disabled={isUpdatingProject || !editNameInput.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        <Save className="h-4 w-4" />
                        {isUpdatingProject ? "저장 중..." : "저장"}
                      </button>
                    )}

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                          Members
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          <Users className="h-3.5 w-3.5" />
                          {projectDetail?.memberCount ?? 0}명
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(projectDetail?.members ?? []).length > 0 ? (
                          projectDetail?.members.map((member) => (
                            <div
                              key={member.userId}
                              className="rounded-lg border border-[#E5E5E5] bg-white px-3 py-2"
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                {member.nickname || `사용자 ${member.userId}`}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                user_id {member.userId}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-400">
                            참여 중인 멤버 정보가 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm auth-fade-up auth-delay-2">
                  <div className="mb-5 flex items-start justify-between gap-3 border-b border-[#F0F0F0] pb-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                        Pipeline
                      </p>
                      <h3 className="text-base font-bold text-gray-900">파이프라인 상세</h3>
                    </div>
                    {remainingCount !== undefined && (
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        AI {remainingCount}회
                      </span>
                    )}
                  </div>

                  {canCreateProject ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {pipelineSummaries.length > 0 ? (
                          pipelineSummaries.map((pipeline) => (
                            <div
                              key={`${pipeline.category}-${pipeline.pipeId}`}
                              className="rounded-lg border border-[#E5E5E5] px-3 py-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {pipeline.pipelineName || `${pipeline.category} 파이프라인`}
                                </p>
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                                  {pipeline.category}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-[11px] text-gray-400">
                                {pipeline.githubRepoUrl ?? "GitHub 저장소 미연결"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-400">
                            생성된 파이프라인이 없습니다.
                          </p>
                        )}
                      </div>

                      {pipelineEmptyMessage && (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          {pipelineEmptyMessage}
                        </p>
                      )}

                      <div className="grid gap-2">
                        <button
                          type="button"
                          disabled={isFetchingProjectPipelines}
                          onClick={() => void onViewPipeline("FE")}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Layers className="h-4 w-4" />
                          프론트엔드 파이프라인 보기
                        </button>
                        <button
                          type="button"
                          disabled={isFetchingProjectPipelines}
                          onClick={() => void onViewPipeline("BE")}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Server className="h-4 w-4" />
                          백엔드 파이프라인 보기
                        </button>
                        <button
                          type="button"
                          disabled={hasNoAiCalls}
                          onClick={onGoToPipelineForm}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400"
                        >
                          <GitBranch className="h-4 w-4" />
                          파이프라인 생성하기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">
                      프로젝트 상세 정보와 참여 멤버를 확인할 수 있습니다.
                    </div>
                  )}
                </aside>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE PROJECT ──────────────────────────────────────── */}
      {step === "create-project" && (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            <button
              onClick={onCancelCreateProject}
              className="mb-5 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors auth-fade-up"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 프로젝트 목록으로
            </button>

            <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm auth-fade-up auth-delay-1">
              {/* Card header strip */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-6 py-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <FolderOpen className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Project</p>
                  <h2 className="text-base font-bold text-white">새 프로젝트 만들기</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
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
                    className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
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
                    className="w-full resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0F0]">
                  <button
                    onClick={onCancelCreateProject}
                    className="rounded-lg border border-[#E5E5E5] px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => void handleSubmitCreateProject()}
                    disabled={isCreatingProject || !nameInput.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                  >
                    {isCreatingProject ? "생성 중..." : "프로젝트 생성"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIPELINE FORM ───────────────────────────────────────── */}
      {step === "pipeline-form" && (
        <div className="flex flex-1 items-start justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="mb-5 flex items-center justify-between gap-3 auth-fade-up">
              <button
                onClick={onBackToPipelines}
                className="inline-flex min-w-0 items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="truncate">
                  {selectedProject?.name ?? "프로젝트"}
                </span>
              </button>
              {canInviteProject && (
                <button
                  type="button"
                  onClick={onOpenProjectInvite}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <UserPlus className="h-3.5 w-3.5" /> 팀원 초대
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden shadow-sm auth-fade-up auth-delay-1">
              {/* Card header strip */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Zap className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">AI Pipeline</p>
                  <h2 className="text-base font-bold text-white">파이프라인 생성</h2>
                  {remainingCount !== undefined && (
                    <p className="mt-0.5 text-xs font-medium text-white/70">
                      AI call 남은 횟수 {remainingCount}회
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6">
                {isGeneratingPipeline ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-5 h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="text-sm font-bold text-gray-900">AI가 파이프라인을 분석하고 있습니다</p>
                    {generatingFileName && (
                      <p className="mt-2 max-w-[240px] truncate text-xs text-gray-400">{generatingFileName}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">잠시만 기다려 주세요...</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* PDF Drop Zone */}
                    <div>
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        PRD / 기획서 PDF <span className="normal-case text-red-400">*</span>
                      </label>
                      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileInputChange} className="hidden" />
                      <div
                        ref={dropZoneRef}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex min-h-[130px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
                          isDragOver
                            ? "border-indigo-400 bg-indigo-50"
                            : pdfFile
                              ? "border-indigo-300 bg-indigo-50/50"
                              : "border-[#E5E5E5] hover:border-gray-400 hover:bg-gray-50/60"
                        }`}
                      >
                        {pdfFile ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                              <FileText className="h-4.5 w-4.5 text-indigo-600" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-sm font-medium text-gray-900">{pdfFile.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">PDF · 클릭하여 다시 선택</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                              className="ml-1 shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : isDragOver ? (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-7 w-7 text-indigo-500" strokeWidth={1.5} />
                            <p className="text-sm font-bold text-indigo-700">여기에 PDF를 놓으세요</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                              <Upload className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">PDF를 끌어다 놓거나 클릭하여 선택</p>
                            <p className="text-[11px] text-gray-400">기획서, PRD 문서 지원</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        카테고리
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORY_OPTIONS.map((opt) => {
                          const active = categoryOption === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setCategoryOption(opt.value)}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all ${
                                active
                                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                                  : "border-[#E5E5E5] text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                              }`}
                            >
                              <opt.Icon className={`h-4 w-4 ${active ? "text-white" : "text-gray-400"}`} />
                              <span>{opt.label}</span>
                              <span className={`text-[10px] font-normal ${active ? "text-white/70" : "text-gray-400"}`}>
                                {opt.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
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
                        className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
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
                        className="w-full resize-none rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSubmitGeneratePipeline()}
                      disabled={hasNoAiCalls || !pdfFile || !techStackInput.trim() || !requirementsInput.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                    >
                      <Zap className="h-4 w-4" />
                      파이프라인 생성
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
