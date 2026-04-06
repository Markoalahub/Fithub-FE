export * from "./auth";

export type Task = {
  id: string;
  title: string;
  completed?: boolean;
  devChecked: boolean;
  pmConfirmed: boolean;
  isAiSuggested?: boolean;
};

export type Feature = {
  id: number;
  name: string;
  tasks: Task[];
};

export type PipelineProposalAction =
  | "add-feature"
  | "edit-feature"
  | "delete-feature"
  | "add-task"
  | "edit-task"
  | "delete-task";

export type PipelineProposalStatus = "pending" | "approved" | "rejected";

export type PipelineProposal = {
  id: string;
  action: PipelineProposalAction;
  featureId?: number;
  featureName?: string;
  taskId?: string;
  taskTitle?: string;
  proposedValue?: string;
  messages: QuestionMessage[];
  createdAt: string;
  status: PipelineProposalStatus;
  pmConfirmed: boolean;
  devConfirmed: boolean;
  closedAt?: string;
  resultMessage?: string;
};

export type TimelineMessage = {
  id: string;
  role: "pm" | "dev";
  content: string;
  aiTranslation: string;
  time: string;
};

export type FeatureQuestion = {
  id: string;
  featureId: number;
  featureName: string;
  taskId: string | undefined;
  taskTitle: string | undefined;
  messages: QuestionMessage[];
  createdAt: string;
  pmConfirmed: boolean;
  devConfirmed: boolean;
  closed: boolean;
  closedAt?: string;
};

export type QuestionMessage = {
  id: string;
  role: "pm" | "dev";
  content: string;
  createdAt: string;
};

export type KnowledgeDocument = {
  id: string;
  name: string;
  uploadedAt: string;
  sizeLabel: string;
};
