export type Status = "todo" | "doing" | "done";

export interface Task  {
    id: string;
    title: string;
    description?: string;
    status: Status;
    createdAt: number;
};