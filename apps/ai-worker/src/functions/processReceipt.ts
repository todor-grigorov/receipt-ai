import { app, EventGridEvent, InvocationContext } from "@azure/functions";
import axios from "axios";
import { ReceiptJobSchema } from "../models/receiptJob";
import { generateSasUrl } from "../services/blobService";
import { parseReceipt } from "../services/geminiService";
import {
  getJobByCorrelationId,
  getReceiptIdByCorrelationId,
  logAuditEvent,
  saveReceiptResult,
  updateJobStatus,
} from "../services/dbService";
import {
  notifyCompleted,
  notifyFailed,
  notifyProcessing,
} from "../services/notificationService";

const WAIT_FOR_JOB_MAX_ATTEMPTS = 5;
const WAIT_FOR_JOB_DELAY_MS = 2000;

async function waitForJob(
  correlationId: string,
  context: InvocationContext,
): Promise<{ userId: string; blobUrl: string }> {
  for (let attempt = 1; attempt <= WAIT_FOR_JOB_MAX_ATTEMPTS; attempt++) {
    const job = await getJobByCorrelationId(correlationId);

    if (job) {
      context.log(
        `Job found for correlationId: ${correlationId} on attempt ${attempt}`,
      );
      return job;
    }

    context.log(
      `Job not found yet for correlationId: ${correlationId}, attempt ${attempt}/${WAIT_FOR_JOB_MAX_ATTEMPTS}, waiting ${WAIT_FOR_JOB_DELAY_MS}ms...`,
    );

    await new Promise((resolve) => setTimeout(resolve, WAIT_FOR_JOB_DELAY_MS));
  }

  throw new Error(
    `Job with correlationId ${correlationId} not found after ${WAIT_FOR_JOB_MAX_ATTEMPTS} attempts`,
  );
}

export async function processReceiptHandler(
  event: EventGridEvent,
  context: InvocationContext,
): Promise<void> {
  const correlationId = extractCorrelationId(event);

  context.log(`Processing receipt for correlationId: ${correlationId}`);

  try {
    // Step 1 — Wait for the Job record to exist in the DB
    // Event Grid fires almost immediately after blob creation, but the API's
    // TransactionScope may not have committed the Job record yet.
    await waitForJob(correlationId, context);

    // Step 2 — Notify ASP.NET API that processing has started
    await notifyProcessing(correlationId);
    await updateJobStatus(correlationId, "Processing");

    context.log(`Job status updated to Processing: ${correlationId}`);

    // Step 3 — Parse and validate the Event Grid event payload
    const jobData = ReceiptJobSchema.safeParse(extractJobData(event));

    if (!jobData.success) {
      throw new Error(
        `Invalid event payload: ${JSON.stringify(jobData.error.issues)}`,
      );
    }

    const job = jobData.data;

    context.log(`Downloading blob: ${job.blobUrl}`);

    // Step 4 — Download the file from Blob Storage via SAS URL
    const sasUrl = await generateSasUrl(job.blobUrl);
    const fileResponse = await axios.get(sasUrl, {
      responseType: "arraybuffer",
    });

    const fileBuffer = Buffer.from(fileResponse.data);

    context.log(`Blob downloaded, size: ${fileBuffer.length} bytes`);

    // Step 5 — Call Gemini to parse the receipt
    context.log(`Calling Gemini for correlationId: ${correlationId}`);

    await logAuditEvent(correlationId, "LlmRequestSent", "azure-function");

    const receiptResult = await parseReceipt(fileBuffer, job.contentType);

    await logAuditEvent(correlationId, "LlmResponseReceived", "azure-function");

    context.log(`Gemini parsing completed for correlationId: ${correlationId}`);

    // Step 6 — Save result to PostgreSQL
    const receiptId = await saveReceiptResult(
      correlationId,
      job.userId,
      job.fileName,
      receiptResult,
    );

    context.log(`Receipt saved to DB with id: ${receiptId}`);

    // Step 7 — Notify ASP.NET API that job completed successfully
    await notifyCompleted(correlationId, receiptId);

    context.log(`Job completed successfully: ${correlationId}`);
  } catch (error) {
    // PostgreSQL unique violation (23505) — a parallel invocation already
    // saved the Receipt successfully. Fetch the existing Receipt ID and
    // notify completed so the frontend receives the correct signal.
    if ((error as any).code === "23505") {
      context.log(
        `Duplicate processing detected for correlationId: ${correlationId}, fetching existing receipt and notifying completion`,
      );

      try {
        const existingReceiptId =
          await getReceiptIdByCorrelationId(correlationId);

        if (existingReceiptId) {
          await notifyCompleted(correlationId, existingReceiptId);
          context.log(
            `Notified completion using existing receipt: ${existingReceiptId}`,
          );
        } else {
          context.log(
            `Could not find existing receipt for correlationId: ${correlationId}`,
          );
        }
      } catch (recoveryError) {
        context.error(
          "Failed to recover from duplicate processing:",
          recoveryError,
        );
      }

      return;
    }

    // Temporary: log the full axios error response
    if ((error as any).response) {
      context.error("HTTP error response:", {
        status: (error as any).response.status,
        data: (error as any).response.data,
        url: (error as any).response.config?.url,
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    context.error(`Job failed for correlationId: ${correlationId}`, error);

    try {
      await updateJobStatus(correlationId, "Failed", errorMessage);
      await notifyFailed(correlationId, errorMessage);
    } catch (notifyError) {
      context.error("Failed to notify failure:", notifyError);
    }
  }
}

export function extractCorrelationId(event: EventGridEvent): string {
  const subject = event.subject as string;
  const blobName = subject.split("/blobs/")[1];
  const fileName = blobName.split("/")[1];
  const correlationId = fileName.split(".")[0];
  return correlationId;
}

export function extractJobData(event: EventGridEvent): unknown {
  const data = event.data as {
    url: string;
    contentType: string;
  };

  const url = new URL(data.url);
  const pathParts = url.pathname.split("/");
  const userId = pathParts[pathParts.length - 2];
  const fileWithExt = pathParts[pathParts.length - 1];
  const correlationId = fileWithExt.split(".")[0];
  const extension = fileWithExt.split(".")[1];

  const contentTypeMap: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return {
    correlationId,
    blobUrl: data.url,
    userId,
    fileName: fileWithExt,
    contentType:
      data.contentType ||
      contentTypeMap[extension] ||
      "application/octet-stream",
  };
}

// Register the function with the Azure Functions runtime
app.eventGrid("processReceipt", {
  handler: processReceiptHandler,
});
