export * from "./auth";

export type CardPosition = { x: number; y: number };
export type AppTab = "pipeline" | "settings" | "review";

export type Task = {
  id: string;
  title: string;
  description?: string;
  isAiSuggested?: boolean;
  pipelineId?: number;
  pipelineStepId?: number;
};

export type Feature = {
  id: number;
  name: string;
  tasks: Task[];
};

export type KnowledgeDocument = {
  id: string;
  name: string;
  uploadedAt: string;
  sizeLabel: string;
};
