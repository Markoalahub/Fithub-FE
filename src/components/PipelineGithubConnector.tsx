import { useState } from "react";
import {
  ExternalLink,
  GitBranch,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import {
  connectPipelineGithubRepository,
  fetchDeveloperRepositories,
  fetchDeveloperRepositoryDetail,
  type DeveloperRepository,
  type DeveloperRepositoryDetail,
  type PipelineGithubConnectionResponse,
} from "../services/api";

interface PipelineGithubConnectorProps {
  pipelineId: number | null;
  githubRepoUrl: string | null;
  onConnected: (
    response: PipelineGithubConnectionResponse,
    repository?: DeveloperRepositoryDetail,
  ) => void;
  onPushToast: (message: string, tone: "success" | "info" | "warning") => void;
}

const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR");
};

export default function PipelineGithubConnector({
  pipelineId,
  githubRepoUrl,
  onConnected,
  onPushToast,
}: PipelineGithubConnectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [repositories, setRepositories] = useState<DeveloperRepository[]>([]);
  const [selectedRepository, setSelectedRepository] =
    useState<DeveloperRepositoryDetail | null>(null);
  const [isLoadingRepositories, setIsLoadingRepositories] = useState(false);
  const [isLoadingRepositoryDetail, setIsLoadingRepositoryDetail] =
    useState(false);
  const [connectingRepoId, setConnectingRepoId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRepositories = async () => {
    if (!pipelineId) {
      onPushToast("먼저 파이프라인을 조회해 주세요.", "warning");
      return;
    }

    setIsLoadingRepositories(true);
    setErrorMessage(null);
    try {
      const response = await fetchDeveloperRepositories();
      setRepositories(response.repositories);
      if (response.repositories.length === 0) {
        setSelectedRepository(null);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "GitHub 레포지토리 목록을 불러오지 못했습니다.";
      setErrorMessage(message);
      onPushToast(message, "warning");
      setRepositories([]);
      setSelectedRepository(null);
    } finally {
      setIsLoadingRepositories(false);
    }
  };

  const openRepositoryPanel = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && repositories.length === 0 && !isLoadingRepositories) {
      void loadRepositories();
    }
  };

  const loadRepositoryDetail = async (repository: DeveloperRepository) => {
    setIsLoadingRepositoryDetail(true);
    setErrorMessage(null);
    try {
      const detail = await fetchDeveloperRepositoryDetail(repository.repoId);
      setSelectedRepository(detail);
      return detail;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "GitHub 레포지토리 상세 정보를 불러오지 못했습니다.";
      setErrorMessage(message);
      onPushToast(message, "warning");
      return null;
    } finally {
      setIsLoadingRepositoryDetail(false);
    }
  };

  const connectRepository = async (repository: DeveloperRepository) => {
    if (!pipelineId) {
      onPushToast("먼저 파이프라인을 조회해 주세요.", "warning");
      return;
    }

    setConnectingRepoId(repository.repoId);
    try {
      const detail =
        selectedRepository?.repoId === repository.repoId
          ? selectedRepository
          : await loadRepositoryDetail(repository);
      if (!detail) return;

      const response = await connectPipelineGithubRepository(pipelineId, {
        githubRepoUrl: detail.repoUrl,
      });
      onConnected(response, detail);
      onPushToast(`${detail.repoUrlName} 레포지토리를 연결했습니다.`, "success");
      setIsOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "GitHub 레포지토리 연결에 실패했습니다.";
      onPushToast(message, "warning");
    } finally {
      setConnectingRepoId(null);
    }
  };

  return (
    <section
      data-ui-control="true"
      className="shrink-0 border-b border-gray-200 bg-white px-5 py-3"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            GitHub Repository
          </p>
          {githubRepoUrl ? (
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-gray-700"
            >
              <span className="truncate">{githubRepoUrl}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <p className="mt-1 text-sm font-medium text-gray-500">
              연결된 레포지토리가 없습니다.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openRepositoryPanel}
            disabled={!pipelineId}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <GitBranch className="h-4 w-4" />
            레포지토리 연결
          </button>
          {isOpen && (
            <button
              type="button"
              onClick={() => void loadRepositories()}
              disabled={isLoadingRepositories}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoadingRepositories ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "새로고침"
              )}
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50">
            {isLoadingRepositories ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                레포지토리 목록을 불러오는 중입니다.
              </div>
            ) : errorMessage ? (
              <div className="px-4 py-4 text-sm text-red-600">
                {errorMessage}
              </div>
            ) : repositories.length === 0 ? (
              <div className="px-4 py-8 text-sm text-gray-500">
                조회된 레포지토리가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {repositories.map((repository) => {
                  const isSelected =
                    selectedRepository?.repoId === repository.repoId;
                  const isConnectingThisRepository =
                    connectingRepoId === repository.repoId;
                  const isConnected = githubRepoUrl === repository.repoUrl;

                  return (
                    <div
                      key={repository.repoId}
                      className={`bg-white px-4 py-3 ${
                        isSelected ? "ring-1 ring-inset ring-gray-900" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <button
                          type="button"
                          onClick={() => void loadRepositoryDetail(repository)}
                          className="min-w-0 text-left"
                        >
                          <span className="block break-all text-sm font-semibold text-gray-900">
                            {repository.repoUrlName || repository.repoName}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5">
                              {repository.isPrivate ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                              {repository.isPrivate ? "Private" : "Public"}
                            </span>
                            <span>{repository.language || "언어 미표기"}</span>
                            <span>Star {repository.starCount.toLocaleString()}</span>
                            <span>Open {repository.openIssuesCount.toLocaleString()}</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void connectRepository(repository)}
                          disabled={isConnectingThisRepository || isConnected}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          {isConnected
                            ? "연결됨"
                            : isConnectingThisRepository
                              ? "연결 중"
                              : "연결"}
                        </button>
                      </div>
                      {repository.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                          {repository.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            {isLoadingRepositoryDetail ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                상세 정보를 불러오는 중입니다.
              </div>
            ) : selectedRepository ? (
              <div className="space-y-3">
                <div>
                  <p className="break-all text-sm font-semibold text-gray-900">
                    {selectedRepository.repoUrlName}
                  </p>
                  <a
                    href={selectedRepository.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gray-700 underline underline-offset-4"
                  >
                    GitHub에서 열기
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <dt className="text-gray-400">기본 브랜치</dt>
                    <dd className="font-medium text-gray-800">
                      {selectedRepository.defaultBranch ?? "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Push</dt>
                    <dd className="font-medium text-gray-800">
                      {formatDateLabel(selectedRepository.pushedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Update</dt>
                    <dd className="font-medium text-gray-800">
                      {formatDateLabel(selectedRepository.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Clone URL</dt>
                    <dd className="truncate font-medium text-gray-800">
                      {selectedRepository.cloneUrl ?? "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                레포지토리를 선택하면 상세 정보를 확인할 수 있습니다.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
