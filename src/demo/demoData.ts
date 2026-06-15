import type { DemoProject } from "../components/ProjectWorkspaceSection";
import type {
  GenerateProjectPipelineResponse,
  PipelineGenerationCategory,
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
    "서버 재오픈 전에도 프로젝트 생성, 사용자 초대, PRD 목업 파이프라인 생성을 둘러볼 수 있는 목업 프로젝트입니다.",
  creatorId: 1,
  creatorNickname: DEMO_USERS.pm.name,
  createdAt: "2026-06-15T09:00:00.000Z",
  updatedAt: "2026-06-15T09:00:00.000Z",
};

export const DEMO_PROJECT_DETAIL: ProjectDetail = {
  projectId: DEMO_PROJECT.id,
  projectName: DEMO_PROJECT.name,
  projectDescription: DEMO_PROJECT.description,
  members: [{ userId: 1, nickname: DEMO_USERS.pm.name }],
  memberCount: 1,
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
      featTitle: "기획자 체험 진입",
      priority: 1,
      featDetails: [
        "랜딩에서 서버 재오픈 전 체험판 안내와 CTA 표시",
        "직군 선택 화면에서 기획자 카드만 활성화",
        "기획자 선택 시 PM 데모 세션을 생성하고 프로젝트 생성 단계로 이동",
      ],
    },
    {
      featId: 2,
      featTitle: "프로젝트 생성과 사용자 초대",
      priority: 2,
      featDetails: [
        "사용자가 입력한 프로젝트명과 설명으로 로컬 프로젝트 생성",
        "닉네임 조회 후 목업 사용자를 프로젝트 멤버로 추가",
        "초대 완료 후 PRD 목업 파이프라인 생성 단계로 이동",
      ],
    },
    {
      featId: 3,
      featTitle: "PRD 목업 파이프라인 생성",
      priority: 3,
      featDetails: [
        "PDF 업로드 없이 고정 목업 PRD 카드 표시",
        "프론트엔드, 백엔드, ALL 생성 범위 선택 제공",
        "기술 스택과 요청 내용을 입력받되 생성 결과는 고정 목업으로 반환",
      ],
    },
    {
      featId: 4,
      featTitle: "파이프라인 조회와 리뷰",
      priority: 4,
      featDetails: [
        "프로젝트 상세에서 FE/BE 파이프라인 조회 버튼 제공",
        "읽기 전용 카드 보드에서 기능과 세부 작업 표시",
        "내 정보 확인 후 리뷰 탭의 Google Form으로 이동",
      ],
    },
  ],
};

const DEMO_BE_PIPELINE: GenerateProjectPipelineResponse = {
  pipeId: 2201,
  projectId: DEMO_PROJECT.id,
  category: "BE",
  version: 1,
  techStack: "Spring Boot, PostgreSQL",
  githubRepoUrl: null,
  feats: [
    {
      featId: 1,
      featTitle: "서버리스 데모 세션",
      priority: 1,
      featDetails: [
        "로그인 토큰 없이 PM 데모 사용자 정보를 로컬에서 구성",
        "백엔드 환경변수 없이도 앱 시작이 실패하지 않도록 데모 모드 유지",
        "서버 오류와 인증 만료 토스트가 데모 중 노출되지 않도록 분기",
      ],
    },
    {
      featId: 2,
      featTitle: "프로젝트와 초대 상태",
      priority: 2,
      featDetails: [
        "프로젝트 생성, 상세 조회, 멤버 추가를 로컬 상태로 처리",
        "닉네임 검색 결과를 목업 사용자 응답으로 반환",
        "초대 완료 후 파이프라인 생성 화면으로 이동할 상태를 갱신",
      ],
    },
    {
      featId: 3,
      featTitle: "고정 파이프라인 응답",
      priority: 3,
      featDetails: [
        "PRD 파일 없이 FE/BE 목업 파이프라인 응답 반환",
        "ALL 선택 시 프론트엔드와 백엔드 응답을 동시에 저장",
        "요청 내용 입력값은 결과 변경 없이 체험 진행용으로만 사용",
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
  void techStack;
  void requirements;

  return {
    ...source,
    projectId,
    techStack: source.techStack,
    feats: source.feats.map((feat) => ({
      ...feat,
      featDetails: [...feat.featDetails],
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
