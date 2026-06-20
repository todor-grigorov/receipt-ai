import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { EventGridEvent } from "@azure/functions";
import { processReceiptHandler } from "./processReceipt";

// NOTE: local development/testing only — remove before production deployment
app.http("processReceiptHttpTrigger", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "test/process-receipt",
  handler: async (
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> => {
    const body = (await request.json()) as EventGridEvent;
    context.log("Received test event:", JSON.stringify(body));

    try {
      await processReceiptHandler(body, context);
      return { status: 200, jsonBody: { message: "Triggered successfully" } };
    } catch (error) {
      context.error("processReceiptHandler failed:", error);
      return { status: 500, jsonBody: { error: String(error) } };
    }
  },
});
