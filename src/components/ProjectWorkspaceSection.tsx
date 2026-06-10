import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
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
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
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

interface ProjectWorkspaceSectionProps {
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
  developerPipelineCategory: PipelineGenerationCategory | null;
  onSelectProject: (project: DemoProject) => void;
  onGoToCreateProject: () => void;
  onGoToPipelineForm: () => void;
  onCreateProject: (params: {
    name: string;
    description: string;
  }) => Promise<void>;
  onUpdateProject: (params: {
    name: string;
    description: string;
  }) => Promise<void>;
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
  Icon: LucideIcon;
}[] = [
  {
    value: "FE",
    label: "FE",
    description: "프론트엔드",
    Icon: Layers,
  },
  {
    value: "BE",
    label: "BE",
    description: "백엔드",
    Icon: Server,
  },
  {
    value: "ALL",
    label: "ALL",
    description: "FE + BE",
    Icon: Zap,
  },
];

const PIPELINE_LABELS: Record<PipelineGenerationCategory, string> = {
  FE: "프론트엔드",
  BE: "백엔드",
};

const getPipelineIcon = (category: PipelineGenerationCategory) =>
  category === "BE" ? Server : Layers;

const getFileSizeLabel = (file: File) => {
  if (file.size >= 1024 * 1024) {
    return `${(file.size / (1024 * 1024)).toFixed(1)}MB`;
  }

  if (file.size >= 1024) {
    return `${Math.max(1, Math.round(file.size / 1024))}KB`;
  }

  return `${file.size}B`;
};

function LoadingCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-neutral-200 bg-white p-12 text-center shadow-sm auth-fade-up auth-delay-1">
      <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
      <h3 className="text-base font-black text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 auth-fade-up sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-neutral-950">{value}</p>
    </div>
  );
}

export default function ProjectWorkspaceSection({
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
  developerPipelineCategory,
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
}: ProjectWorkspaceSectionProps) {
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [categoryOption, setCategoryOption] =
    useState<PipelineCategoryOption>("FE");
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
  const developerPipelineLabel =
    developerPipelineCategory === "BE" ? "백엔드" : "프론트엔드";
  const selectedProjectName =
    projectDetail?.projectName ?? selectedProject?.name ?? "프로젝트";
  const selectedProjectDescription =
    projectDetail?.projectDescription?.trim() ||
    selectedProject?.description?.trim() ||
    "프로젝트 설명이 없습니다.";

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

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!dropZoneRef.current?.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndSetPdf(file);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      validateAndSetPdf(file);
    }
  };

  const handleSubmitCreateProject = async () => {
    const name = nameInput.trim();

    if (!name) {
      onPushToast("프로젝트 이름을 입력해 주세요.", "warning");
      return;
    }

    await onCreateProject({ name, description: descriptionInput.trim() });
  };

  const handleSubmitUpdateProject = async () => {
    const name = editNameInput.trim();

    if (!name) {
      onPushToast("프로젝트 이름을 입력해 주세요.", "warning");
      return;
    }

    await onUpdateProject({
      name,
      description: editDescriptionInput.trim(),
    });
    setIsEditingProject(false);
  };

  const handleSubmitGeneratePipeline = async () => {
    if (hasNoAiCalls) {
      onPushToast("AI 파이프라인 생성 가능 횟수가 없습니다.", "warning");
      return;
    }

    if (!pdfFile) {
      onPushToast("PDF 파일을 선택해 주세요.", "warning");
      return;
    }

    if (!techStackInput.trim()) {
      onPushToast("기술 스택을 입력해 주세요.", "warning");
      return;
    }

    if (!requirementsInput.trim()) {
      onPushToast("요구사항을 입력해 주세요.", "warning");
      return;
    }

    await onGeneratePipeline({
      file: pdfFile,
      category: categoryOption,
      techStack: techStackInput.trim(),
      requirements: requirementsInput.trim(),
    });
  };

  const projectListDescription = canCreateProject
    ? "프로젝트를 만들고 PRD 기반 파이프라인을 생성하세요."
    : "참여 중인 프로젝트를 선택해 파이프라인을 확인하세요.";
  const emptyTitle = canCreateProject
    ? "아직 프로젝트가 없습니다."
    : "참여 중인 프로젝트가 없습니다.";
  const emptyDescription = canCreateProject
    ? "첫 프로젝트를 생성하면 PRD PDF 기반 파이프라인 생성을 시작할 수 있습니다."
    : "기획자가 초대한 프로젝트가 생기면 이곳에 표시됩니다.";

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F6F6F4] text-neutral-950">
      {step === "project-list" && (
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center px-6 py-10">
          <PageTitle
            eyebrow="Project Workspace"
            title="프로젝트"
            description={projectListDescription}
            action={
              canCreateProject &&
              projects.length > 0 && (
                <button
                  type="button"
                  onClick={onGoToCreateProject}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />새 프로젝트
                </button>
              )
            }
          />

          {isFetchingProjects ? (
            <LoadingCard
              title="프로젝트를 불러오는 중입니다."
              description="참여 중인 프로젝트 목록을 조회하고 있습니다."
            />
          ) : projects.length === 0 ? (
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-12 text-center shadow-sm auth-fade-up auth-delay-1">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-neutral-950 text-white shadow-sm">
                <FolderOpen className="h-9 w-9" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-neutral-950">
                {emptyTitle}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-neutral-500">
                {emptyDescription}
              </p>
              {canCreateProject && (
                <button
                  type="button"
                  onClick={onGoToCreateProject}
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
                >
                  <Plus className="h-4 w-4" />첫 프로젝트 만들기
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 auth-fade-up auth-delay-1 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, index) => {
                const isDeleting = deletingProjectId === project.id;

                return (
                  <div
                    key={project.id}
                    style={{ animationDelay: `${120 + index * 60}ms` }}
                    className="group rounded-[1.75rem] border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-200/70 auth-fade-up"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectProject(project)}
                      className="flex min-h-[190px] w-full flex-col rounded-[1.35rem] bg-[#FAFAF8] p-5 text-left transition-colors group-hover:bg-[#F6F6F4]"
                    >
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm">
                          <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-neutral-700" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-lg font-black leading-snug tracking-tight text-neutral-950">
                          {project.name}
                        </h3>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                          {project.description || "프로젝트 설명이 없습니다."}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4">
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-neutral-500 shadow-sm">
                          Project #{project.id}
                        </span>
                        {project.creatorNickname && (
                          <span className="max-w-[120px] truncate text-xs font-semibold text-neutral-400">
                            {project.creatorNickname}
                          </span>
                        )}
                      </div>
                    </button>

                    {canDeleteProject && (
                      <button
                        type="button"
                        aria-label={`${project.name} 삭제`}
                        disabled={isDeleting}
                        onClick={() => onRequestDeleteProject(project)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-400 transition-colors hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isDeleting ? "삭제 중..." : "프로젝트 삭제"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "project-detail" && (
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="mb-5 flex items-center justify-between gap-3 auth-fade-up">
            <button
              type="button"
              onClick={onBackToPipelines}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-500 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              프로젝트 목록으로
            </button>

            {canInviteProject && (
              <button
                type="button"
                onClick={onOpenProjectInvite}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white"
              >
                <UserPlus className="h-3.5 w-3.5" />
                팀원 초대
              </button>
            )}
          </div>

          {isFetchingProjectDetail ? (
            <LoadingCard
              title="프로젝트 상세 정보를 불러오는 중입니다."
              description="참여 인원과 파이프라인 정보를 확인하고 있습니다."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm auth-fade-up auth-delay-1">
                <div className="rounded-[1.5rem] bg-[#FAFAF8] p-6">
                  <div className="mb-6 flex items-start justify-between gap-4 border-b border-neutral-200 pb-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
                        Project Detail
                      </p>

                      {isEditingProject ? (
                        <input
                          value={editNameInput}
                          onChange={(event) =>
                            setEditNameInput(event.target.value)
                          }
                          className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg font-black text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                          maxLength={60}
                        />
                      ) : (
                        <h2 className="mt-3 truncate text-3xl font-black tracking-tight text-neutral-950">
                          {selectedProjectName}
                        </h2>
                      )}
                    </div>

                    {canUpdateProject && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProject((prev) => !prev)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white"
                      >
                        {isEditingProject ? (
                          <>
                            <X className="h-3.5 w-3.5" />
                            취소
                          </>
                        ) : (
                          <>
                            <Pencil className="h-3.5 w-3.5" />
                            수정
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        Description
                      </p>
                      {isEditingProject ? (
                        <textarea
                          rows={4}
                          value={editDescriptionInput}
                          onChange={(event) =>
                            setEditDescriptionInput(event.target.value)
                          }
                          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-800 outline-none transition-colors focus:border-neutral-950"
                          maxLength={200}
                        />
                      ) : (
                        <p className="min-h-[72px] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-7 text-neutral-600">
                          {selectedProjectDescription}
                        </p>
                      )}
                    </div>

                    {isEditingProject && (
                      <button
                        type="button"
                        onClick={() => void handleSubmitUpdateProject()}
                        disabled={isUpdatingProject || !editNameInput.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
                      >
                        <Save className="h-4 w-4" />
                        {isUpdatingProject ? "저장 중..." : "프로젝트 저장"}
                      </button>
                    )}

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                          Members
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-600 shadow-sm">
                          <Users className="h-3.5 w-3.5" />
                          {projectDetail?.memberCount ?? 0}명
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {(projectDetail?.members ?? []).length > 0 ? (
                          projectDetail?.members.map((member) => (
                            <div
                              key={member.userId}
                              className="rounded-2xl border border-neutral-200 bg-white p-4"
                            >
                              <p className="text-sm font-bold text-neutral-950">
                                {member.nickname || `사용자 ${member.userId}`}
                              </p>
                              <p className="mt-1 text-xs text-neutral-400">
                                user_id {member.userId}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-400">
                            참여 중인 멤버 정보가 없습니다.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm auth-fade-up auth-delay-2">
                <div className="rounded-[1.5rem] bg-neutral-950 p-6 text-white">
                  <div className="mb-6 flex items-start justify-between gap-3 border-b border-white/10 pb-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
                        Pipeline
                      </p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight">
                        파이프라인
                      </h3>
                    </div>

                    {remainingCount !== undefined && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-950">
                        AI {remainingCount}회
                      </span>
                    )}
                  </div>

                  {canCreateProject ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {pipelineSummaries.length > 0 ? (
                          pipelineSummaries.map((pipeline) => {
                            const category =
                              pipeline.category as PipelineGenerationCategory;
                            const Icon = getPipelineIcon(category);

                            return (
                              <div
                                key={`${pipeline.category}-${pipeline.pipeId}`}
                                className="rounded-2xl border border-white/10 bg-white/10 p-4"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-950">
                                      <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-white">
                                        {pipeline.pipelineName ||
                                          `${pipeline.category} 파이프라인`}
                                      </p>
                                      <p className="mt-0.5 truncate text-xs text-neutral-400">
                                        {pipeline.githubRepoUrl ??
                                          "GitHub 저장소 미연결"}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                                    {pipeline.category}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-sm leading-6 text-neutral-400">
                            생성된 파이프라인이 없습니다.
                          </div>
                        )}
                      </div>

                      {pipelineEmptyMessage && (
                        <p className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-semibold text-neutral-300">
                          {pipelineEmptyMessage}
                        </p>
                      )}

                      <div className="grid gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isFetchingProjectPipelines}
                          onClick={() => void onViewPipeline("FE")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-neutral-200 disabled:opacity-50"
                        >
                          <Layers className="h-4 w-4" />
                          FE 파이프라인 보기
                        </button>

                        <button
                          type="button"
                          disabled={isFetchingProjectPipelines}
                          onClick={() => void onViewPipeline("BE")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15 disabled:opacity-50"
                        >
                          <Server className="h-4 w-4" />
                          BE 파이프라인 보기
                        </button>

                        <button
                          type="button"
                          disabled={hasNoAiCalls}
                          onClick={onGoToPipelineForm}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <GitBranch className="h-4 w-4" />
                          파이프라인 생성하기
                        </button>
                      </div>
                    </div>
                  ) : developerPipelineCategory ? (
                    <div className="space-y-4">
                      <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-neutral-300">
                        {pipelineEmptyMessage ||
                          `${developerPipelineLabel} 파이프라인을 조회할 수 있습니다.`}
                      </p>

                      <button
                        type="button"
                        disabled={isFetchingProjectPipelines}
                        onClick={() =>
                          void onViewPipeline(developerPipelineCategory)
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-neutral-200 disabled:opacity-50"
                      >
                        {developerPipelineCategory === "BE" ? (
                          <Server className="h-4 w-4" />
                        ) : (
                          <Layers className="h-4 w-4" />
                        )}
                        {developerPipelineLabel} 파이프라인 보기
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-neutral-300">
                      프로젝트 상세 정보와 참여 멤버를 확인할 수 있습니다.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {step === "create-project" && (
        <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg">
            <button
              type="button"
              onClick={onCancelCreateProject}
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-500 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white auth-fade-up"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              프로젝트 목록으로
            </button>

            <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm auth-fade-up auth-delay-1">
              <div className="rounded-[1.5rem] bg-neutral-950 px-6 py-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">
                      Project
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight">
                      새 프로젝트 만들기
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    프로젝트 이름{" "}
                    <span className="normal-case text-neutral-950">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.nativeEvent.isComposing &&
                        !isCreatingProject
                      ) {
                        void handleSubmitCreateProject();
                      }
                    }}
                    placeholder="예: Fithub Beta"
                    maxLength={60}
                    autoFocus
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    프로젝트 설명
                  </label>
                  <textarea
                    rows={4}
                    value={descriptionInput}
                    onChange={(event) =>
                      setDescriptionInput(event.target.value)
                    }
                    placeholder="프로젝트에 대한 간단한 설명을 입력하세요."
                    maxLength={200}
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-950"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-neutral-200 pt-5">
                  <button
                    type="button"
                    onClick={onCancelCreateProject}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmitCreateProject()}
                    disabled={isCreatingProject || !nameInput.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
                  >
                    <Plus className="h-4 w-4" />
                    {isCreatingProject ? "생성 중..." : "프로젝트 생성"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "pipeline-form" && (
        <div className="mx-auto flex min-h-full w-full max-w-6xl items-start justify-center px-6 py-10">
          <div className="w-full max-w-5xl">
            <div className="mb-5 flex items-center justify-between gap-3 auth-fade-up">
              <button
                type="button"
                onClick={onBackToPipelines}
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-500 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white"
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
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 shadow-sm transition-colors hover:bg-neutral-950 hover:text-white"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  팀원 초대
                </button>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <aside className="rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm auth-fade-up auth-delay-1">
                <div className="flex h-full flex-col rounded-[1.5rem] bg-neutral-950 p-6 text-white">
                  <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Pipeline
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">
                      PRD를 FE/BE 파이프라인으로 변환합니다.
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-neutral-400">
                      서비스 기획 PRD PDF를 업로드하면 선택한 범위에 따라
                      Frontend와 Backend 작업 흐름을 생성합니다.
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <SmallMetric label="Plan" value="Free" />
                    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        AI Token
                      </p>
                      <p className="mt-2 text-lg font-black text-white">
                        {remainingCount ?? "-"}회
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <BadgeCheck className="h-4 w-4" />
                        현재 베타 제공 기능
                      </p>
                      <p className="mt-2 text-xs leading-6 text-neutral-400">
                        PDF 분석, FE/BE 파이프라인 생성, 프로젝트별 파이프라인
                        조회 기능을 먼저 제공합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white p-3 shadow-sm auth-fade-up auth-delay-2">
                <div className="rounded-[1.5rem] bg-[#FAFAF8] p-6">
                  {isGeneratingPipeline ? (
                    <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
                      <div className="mb-5 h-12 w-12 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                      <h3 className="text-xl font-black tracking-tight text-neutral-950">
                        AI가 파이프라인을 분석하고 있습니다.
                      </h3>
                      {generatingFileName && (
                        <p className="mt-3 max-w-[280px] truncate rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-500">
                          {generatingFileName}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-neutral-500">
                        PRD 내용을 기능과 세부 작업 단위로 정리하는 중입니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">
                          Upload PRD
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">
                          파이프라인 생성
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-neutral-500">
                          PRD PDF와 기술 스택, 요구사항을 입력해 프로젝트
                          파이프라인을 생성하세요.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                          PRD / 기획서 PDF{" "}
                          <span className="normal-case text-neutral-950">
                            *
                          </span>
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
                          className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                            isDragOver
                              ? "border-neutral-950 bg-white"
                              : pdfFile
                                ? "border-neutral-950 bg-white"
                                : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50"
                          }`}
                        >
                          {pdfFile ? (
                            <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-neutral-200 bg-[#F6F6F4] p-4 text-left">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
                                <FileText
                                  className="h-5 w-5"
                                  strokeWidth={1.5}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-neutral-950">
                                  {pdfFile.name}
                                </p>
                                <p className="mt-0.5 text-xs text-neutral-400">
                                  PDF · {getFileSizeLabel(pdfFile)} · 클릭하여
                                  다시 선택
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPdfFile(null);
                                }}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 transition-colors hover:bg-neutral-950 hover:text-white"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : isDragOver ? (
                            <div className="flex flex-col items-center gap-3">
                              <Upload
                                className="h-8 w-8 text-neutral-950"
                                strokeWidth={1.5}
                              />
                              <p className="text-sm font-bold text-neutral-950">
                                여기에 PDF를 놓으세요.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                                <Upload className="h-5 w-5" strokeWidth={1.5} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-neutral-700">
                                  PDF를 끌어다 놓거나 클릭하여 선택
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">
                                  PRD, 기획서 PDF 파일을 지원합니다.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                          생성 범위
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {CATEGORY_OPTIONS.map((option) => {
                            const active = categoryOption === option.value;
                            const Icon = option.Icon;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setCategoryOption(option.value)}
                                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-xs font-bold transition-all ${
                                  active
                                    ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                                    : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-950"
                                }`}
                              >
                                <Icon
                                  className={`h-4 w-4 ${
                                    active ? "text-white" : "text-neutral-400"
                                  }`}
                                />
                                <span>{option.label}</span>
                                <span
                                  className={`text-[10px] font-semibold ${
                                    active
                                      ? "text-neutral-400"
                                      : "text-neutral-400"
                                  }`}
                                >
                                  {option.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                          기술 스택{" "}
                          <span className="normal-case text-neutral-950">
                            *
                          </span>
                        </label>
                        <input
                          type="text"
                          value={techStackInput}
                          onChange={(event) =>
                            setTechStackInput(event.target.value)
                          }
                          placeholder="예: React, TypeScript, Spring Boot, MySQL"
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-950"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                          주요 요구사항{" "}
                          <span className="normal-case text-neutral-950">
                            *
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          value={requirementsInput}
                          onChange={(event) =>
                            setRequirementsInput(event.target.value)
                          }
                          placeholder="핵심 기능, 우선순위, 주의사항 등을 간략히 입력하세요."
                          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-950 outline-none transition-colors placeholder:text-neutral-300 focus:border-neutral-950"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleSubmitGeneratePipeline()}
                        disabled={
                          hasNoAiCalls ||
                          !pdfFile ||
                          !techStackInput.trim() ||
                          !requirementsInput.trim()
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-neutral-800 disabled:translate-y-0 disabled:bg-neutral-200 disabled:text-neutral-400"
                      >
                        <Zap className="h-4 w-4" />
                        파이프라인 생성
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
