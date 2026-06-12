import axios from "axios";
import { config } from "../config";
import { JobNotification, JobStatus } from "../models/jobNotification";

const baseUrl = config.ASPNET_API_URL.replace(/\/$/, "");

async function notify(notification: JobNotification): Promise<void> {
  await axios.post(
    `${baseUrl}/api/internal/notifications/jobs/${notification.correlationId}`,
    notification,
    {
      headers: {
        "X-Api-Key": config.ASPNET_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function notifyProcessing(correlationId: string): Promise<void> {
  await notify({
    correlationId,
    status: JobStatus.Processing,
  });
}

export async function notifyCompleted(
  correlationId: string,
  resultId: string,
): Promise<void> {
  await notify({
    correlationId,
    status: JobStatus.Completed,
    resultId,
  });
}

export async function notifyFailed(
  correlationId: string,
  errorMessage: string,
): Promise<void> {
  await notify({
    correlationId,
    status: JobStatus.Failed,
    errorMessage,
  });
}
