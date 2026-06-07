export enum JobStatus {
  Pending = "Pending",
  Processing = "Processing",
  Completed = "Completed",
  Failed = "Failed",
}

export interface JobNotification {
  correlationId: string;
  status: JobStatus;
  resultId?: string;
  errorMessage?: string;
}
