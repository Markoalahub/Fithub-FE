export * from "./auth";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  isAiSuggested?: boolean;
};

export type Feature = {
  id: number;
  name: string;
  tasks: Task[];
};

export type TimelineMessage = {
  id: string;
  role: "pm" | "dev";
  content: string;
  aiTranslation: string;
  time: string;
};
