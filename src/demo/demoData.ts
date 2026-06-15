import type { DemoProject } from "../components/ProjectWorkspaceSection";
import type {
  DeveloperRepositoryDetail,
  GenerateProjectPipelineResponse,
  PipelineGenerationCategory,
  PipelineGithubConnectionResponse,
  PipelineGithubIssueResponse,
  ProjectDetail,
  ProjectPipelineSummary,
} from "../services/api";
import type { AuthUser, Feature, UserRole } from "../types";

export const IS_DEMO_MODE = true;
export const DEMO_REVIEW_FORM_URL = "https://forms.gle/tJ5kSDsgn37C9kX86";
export const DEMO_STORAGE_PREFIX = "fithub.demo.v1";

export const DEMO_USERS: Record<"pm" | "dev-fe" | "dev-be", AuthUser> = {
  pm: {
    id: "demo-pm",
    role: "pm",
    name: "김기획",
    email: "planner@fithub.demo",
    provider: "kakao",
    jobRole: "PLANNER",
    aiPipelineGenerationRemainingCount: 2,
  },
  "dev-fe": {
    id: "demo-fe",
    role: "dev-fe",
    name: "이프론트",
    email: "frontend@fithub.demo",
    provider: "github",
    jobRole: "FRONTEND",
    aiPipelineGenerationRemainingCount: 0,
  },
  "dev-be": {
    id: "demo-be",
    role: "dev-be",
    name: "박백엔드",
    email: "backend@fithub.demo",
    provider: "github",
    jobRole: "BACKEND",
    aiPipelineGenerationRemainingCount: 0,
  },
};

export const DEMO_PROJECT: DemoProject = {
  id: 1001,
  name: "Fithub 체험 프로젝트",
  description:
    "서버 재오픈 전에도 PRD 기반 파이프라인 생성과 PM/개발자 협업 흐름을 둘러볼 수 있는 목업 프로젝트입니다.",
  creatorId: 1,
  creatorNickname: DEMO_USERS.pm.name,
  createdAt: "2026-06-15T09:00:00.000Z",
  updatedAt: "2026-06-15T09:00:00.000Z",
};

export const DEMO_PROJECT_DETAIL: ProjectDetail = {
  projectId: DEMO_PROJECT.id,
  projectName: DEMO_PROJECT.name,
  projectDescription: DEMO_PROJECT.description,
  members: [
    { userId: 1, nickname: DEMO_USERS.pm.name },
    { userId: 2, nickname: DEMO_USERS["dev-fe"].name },
    { userId: 3, nickname: DEMO_USERS["dev-be"].name },
  ],
  memberCount: 3,
};

const DEMO_FE_PIPELINE: GenerateProjectPipelineResponse = {
  pipeId: 2101,
  projectId: DEMO_PROJECT.id,
  category: "FE",
  version: 1,
  techStack: "React, TypeScript, Tailwind CSS",
  githubRepoUrl: null,
  feats: [
    {
      featId: 1,
      featTitle: "체험판 랜딩 및 진입",
      priority: 1,
      featDetails: [
        "서버 재오픈 전 체험판 안내 문구와 CTA 구성",
        "기획자로 체험하기 클릭 시 PM 데모 세션 생성",
        "모바일/데스크톱에서 첫 화면 CTA가 잘 보이도록 반응형 조정",
      ],
    },
    {
      featId: 2,
      featTitle: "프로젝트 워크스페이스",
      priority: 2,
      featDetails: [
        "기본 목업 프로젝트 목록과 상세 화면 표시",
        "프로젝트 수정/삭제/초대 액션을 로컬 상태로 처리",
        "FE/BE 파이프라인 요약과 상세 진입 버튼 제공",
      ],
    },
    {
      featId: 3,
      featTitle: "파이프라인 캔버스",
      priority: 3,
      featDetails: [
        "기능 카드 드래그, 확대/축소, 접기/펼치기 지원",
        "PM/개발자 역할에 따라 제안, 체크, 확인 액션 노출",
        "제안 채팅 패널에서 최종안 확인 및 반영 흐름 제공",
      ],
    },
    {
      featId: 4,
      featTitle: "리뷰 수집 화면",
      priority: 4,
      featDetails: [
        "마지막 탭에 어떠셨나요? 리뷰 안내 화면 추가",
        "리뷰 남기기 버튼을 Google Form 링크로 연결",
        "체험 완료 후 다음 개선 포인트를 자연스럽게 남길 수 있게 구성",
      ],
    },
  ],
};

const DEMO_BE_PIPELINE: GenerateProjectPipelineResponse = {
  pipeId: 2201,
  projectId: DEMO_PROJECT.id,
  category: "BE",
  version: 1,
  techStack: "Spring Boot, PostgreSQL, GitHub API",
  githubRepoUrl: null,
  feats: [
    {
      featId: 1,
      featTitle: "데모 세션 API 대체",
      priority: 1,
      featDetails: [
        "로그인 토큰 없이 데모 사용자 정보를 로컬에서 구성",
        "프로젝트 목록/상세 조회 응답을 목업 데이터로 대체",
        "서버 오류와 인증 만료 토스트가 데모 중 노출되지 않도록 분기",
      ],
    },
    {
      featId: 2,
      featTitle: "파이프라인 생성 목업",
      priority: 2,
      featDetails: [
        "PDF 업로드 없이 목업 PRD 분석 결과 반환",
        "기술 스택과 요구사항 입력값을 생성 결과 메타데이터에 반영",
        "FE/BE/ALL 선택에 맞춰 카테고리별 파이프라인 응답 생성",
      ],
    },
    {
      featId: 3,
      featTitle: "GitHub 연동 목업",
      priority: 3,
      featDetails: [
        "개발자 화면에서 연결 가능한 데모 저장소 목록 제공",
        "저장소 연결 결과를 파이프라인 메타데이터에 저장",
        "세부 작업별 GitHub Issue 생성 응답을 가짜 URL로 반환",
      ],
    },
    {
      featId: 4,
      featTitle: "리뷰 링크 라우팅",
      priority: 4,
      featDetails: [
        "리뷰 탭에서 Google Form을 새 탭으로 열기",
        "외부 폼 이동 전 완료 상태와 안내 문구 표시",
        "서버 재오픈 후에도 리뷰 링크를 쉽게 교체할 수 있게 상수화",
      ],
    },
  ],
};

export const DEMO_PIPELINES: Record<
  PipelineGenerationCategory,
  GenerateProjectPipelineResponse
> = {
  FE: DEMO_FE_PIPELINE,
  BE: DEMO_BE_PIPELINE,
};

export const DEMO_REPOSITORIES: DeveloperRepositoryDetail[] = [
  {
    repoId: 3101,
    repoName: "fithub-demo-fe",
    repoUrlName: "fithub-demo/fithub-demo-fe",
    description: "Fithub 서버리스 체험판 프론트엔드 데모 저장소",
    repoUrl: "https://github.com/fithub-demo/fithub-demo-fe",
    isPrivate: false,
    language: "TypeScript",
    starCount: 42,
    openIssuesCount: 3,
    defaultBranch: "main",
    updatedAt: "2026-06-15T09:00:00.000Z",
    pushedAt: "2026-06-15T09:00:00.000Z",
    cloneUrl: "https://github.com/fithub-demo/fithub-demo-fe.git",
  },
  {
    repoId: 3102,
    repoName: "fithub-demo-be",
    repoUrlName: "fithub-demo/fithub-demo-be",
    description: "Fithub 파이프라인 생성 API 목업 저장소",
    repoUrl: "https://github.com/fithub-demo/fithub-demo-be",
    isPrivate: false,
    language: "Java",
    starCount: 28,
    openIssuesCount: 5,
    defaultBranch: "main",
    updatedAt: "2026-06-15T09:00:00.000Z",
    pushedAt: "2026-06-15T09:00:00.000Z",
    cloneUrl: "https://github.com/fithub-demo/fithub-demo-be.git",
  },
];

export const cloneDemoUser = (role: UserRole): AuthUser => {
  const resolvedRole = role === "dev" ? "dev-fe" : role;
  const user =
    resolvedRole === "pm" || resolvedRole === "dev-fe" || resolvedRole === "dev-be"
      ? DEMO_USERS[resolvedRole]
      : DEMO_USERS["dev-fe"];
  return { ...user };
};

export const cloneDemoProject = (): DemoProject => ({ ...DEMO_PROJECT });

export const cloneDemoProjectDetail = (
  project: DemoProject = DEMO_PROJECT,
): ProjectDetail => ({
  ...DEMO_PROJECT_DETAIL,
  projectId: project.id,
  projectName: project.name,
  projectDescription: project.description,
  members: DEMO_PROJECT_DETAIL.members.map((member) => ({ ...member })),
});

export const cloneDemoPipeline = ({
  category,
  projectId = DEMO_PROJECT.id,
  techStack,
  requirements,
}: {
  category: PipelineGenerationCategory;
  projectId?: number;
  techStack?: string;
  requirements?: string;
}): GenerateProjectPipelineResponse => {
  const source = DEMO_PIPELINES[category];
  const normalizedTechStack = techStack?.trim();
  const normalizedRequirements = requirements?.trim();
  const extraDetail = normalizedRequirements
    ? [`체험 입력 요구사항 반영: ${normalizedRequirements.slice(0, 90)}`]
    : [];

  return {
    ...source,
    projectId,
    techStack: normalizedTechStack || source.techStack,
    feats: source.feats.map((feat, index) => ({
      ...feat,
      featDetails:
        index === 0 ? [...extraDetail, ...feat.featDetails] : [...feat.featDetails],
    })),
  };
};

export const mapDemoPipelineToFeatures = (
  pipeline: GenerateProjectPipelineResponse,
): Feature[] =>
  [...pipeline.feats]
    .sort((a, b) => a.priority - b.priority || a.featId - b.featId)
    .map((feat, index) => {
      const featureId = index + 1;
      return {
        id: featureId,
        name: feat.featTitle,
        tasks: feat.featDetails.map((detail, detailIndex) => ({
          id: `${featureId}-${detailIndex + 1}`,
          title: detail,
          completed: false,
          devChecked: detailIndex === 0 && index < 2,
          pmConfirmed: false,
          isAiSuggested: true,
          pipelineId: pipeline.pipeId,
          pipelineStepId: pipeline.pipeId * 100 + featureId * 10 + detailIndex + 1,
        })),
      };
    });

export const createDemoPipelineSummaries = (
  projectId: number,
  categories: PipelineGenerationCategory[] = ["FE", "BE"],
): ProjectPipelineSummary[] =>
  categories.map((category) => {
    const pipeline = DEMO_PIPELINES[category];
    return {
      pipeId: pipeline.pipeId,
      pipelineName:
        category === "FE" ? "프론트엔드 체험 파이프라인" : "백엔드 체험 파이프라인",
      category,
      githubRepoUrl: pipeline.githubRepoUrl,
    };
  });

export const createDemoGithubConnection = ({
  pipelineId,
  projectId,
  category,
  repoUrl,
}: {
  pipelineId: number;
  projectId: number;
  category: PipelineGenerationCategory;
  repoUrl: string;
}): PipelineGithubConnectionResponse => ({
  pipeId: pipelineId,
  projectId,
  category,
  version: 1,
  techStack: DEMO_PIPELINES[category].techStack,
  githubRepoUrl: repoUrl,
});

export const createDemoGithubIssue = ({
  pipelineId,
  title,
  body,
}: {
  pipelineId: number;
  title: string;
  body: string;
}): PipelineGithubIssueResponse => {
  const githubIssueNumber =
    100 + ((pipelineId + title.length + body.length) % 80);
  return {
    repoId: 3100 + (pipelineId % 10),
    pipelineId,
    githubIssueNumber,
    githubIssueUrl: `https://github.com/fithub-demo/demo/issues/${githubIssueNumber}`,
    title,
    body,
    state: "open",
  };
};
