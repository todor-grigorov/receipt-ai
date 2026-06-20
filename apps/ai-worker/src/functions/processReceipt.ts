import { app, EventGridEvent, InvocationContext } from "@azure/functions";
import axios from "axios";
import { ReceiptJobSchema } from "../models/receiptJob";
import { parseReceipt } from "../services/geminiService";
import {
  logAuditEvent,
  saveReceiptResult,
  updateJobStatus,
} from "../services/dbService";
import {
  notifyCompleted,
  notifyFailed,
  notifyProcessing,
} from "../services/notificationService";

export async function processReceiptHandler(
  event: EventGridEvent,
  context: InvocationContext,
): Promise<void> {
  const correlationId = extractCorrelationId(event);

  context.log(`Processing receipt for correlationId: ${correlationId}`);

  try {
    // Step 1 — Notify ASP.NET API that processing has started
    await notifyProcessing(correlationId);
    await updateJobStatus(correlationId, "Processing");

    context.log(`Job status updated to Processing: ${correlationId}`);

    // Step 2 — Parse and validate the Event Grid event payload
    const jobData = ReceiptJobSchema.safeParse(extractJobData(event));

    if (!jobData.success) {
      throw new Error(
        `Invalid event payload: ${JSON.stringify(jobData.error.issues)}`,
      );
    }

    const job = jobData.data;

    context.log(`Downloading blob: ${job.blobUrl}`);

    // Step 3 — Download the file from Blob Storage via SAS URL
    const fileResponse = await axios.get(job.blobUrl, {
      responseType: "arraybuffer",
    });

    const fileBuffer = Buffer.from(fileResponse.data);

    context.log(`Blob downloaded, size: ${fileBuffer.length} bytes`);

    // Step 4 — Call Gemini to parse the receipt
    context.log(`Calling Gemini for correlationId: ${correlationId}`);

    await logAuditEvent(correlationId, "LlmRequestSent", "azure-function");

    const receiptResult = await parseReceipt(fileBuffer, job.contentType);

    await logAuditEvent(correlationId, "LlmResponseReceived", "azure-function");

    context.log(`Gemini parsing completed for correlationId: ${correlationId}`);

    // Step 5 — Save result to PostgreSQL
    const receiptId = await saveReceiptResult(
      correlationId,
      job.userId,
      job.fileName,
      receiptResult,
    );

    context.log(`Receipt saved to DB with id: ${receiptId}`);

    // Step 6 — Notify ASP.NET API that job completed successfully
    await notifyCompleted(correlationId, receiptId);

    context.log(`Job completed successfully: ${correlationId}`);
  } catch (error) {
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

function extractCorrelationId(event: EventGridEvent): string {
  // The blob name is {userId}/{correlationId}{extension}
  // event.subject = /blobServices/default/containers/receipts/blobs/{userId}/{correlationId}.pdf
  const subject = event.subject as string;
  const blobName = subject.split("/blobs/")[1]; // userId/correlationId.pdf
  const fileName = blobName.split("/")[1]; // correlationId.pdf
  const correlationId = fileName.split(".")[0]; // correlationId
  return correlationId;
}

function extractJobData(event: EventGridEvent): unknown {
  // Event Grid BlobCreated event data
  const data = event.data as {
    url: string;
    contentType: string;
  };

  // Extract metadata from the blob URL
  // URL format: https://storage.blob.core.windows.net/receipts/{userId}/{correlationId}.pdf
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
