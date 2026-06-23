import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

vi.mock("axios");

vi.mock("../../src/config", () => ({
  config: {
    GEMINI_API_KEY: "test-key",
    DATABASE_URL: "postgresql://test",
    ASPNET_API_URL: "http://localhost:5000/",
    ASPNET_API_KEY: "test-internal-key",
  },
}));

import {
  notifyProcessing,
  notifyCompleted,
  notifyFailed,
} from "../../src/services/notificationService";
import { JobStatus } from "../../src/models/jobNotification";

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.post).mockResolvedValue({ status: 200 });
  });

  it("should strip trailing slash from ASPNET_API_URL when building the request URL", async () => {
    await notifyProcessing("corr-123");

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:5000/api/internal/notifications/jobs/corr-123",
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should send the X-Api-Key and Content-Type headers", async () => {
    await notifyProcessing("corr-123");

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      {
        headers: {
          "X-Api-Key": "test-internal-key",
          "Content-Type": "application/json",
        },
      },
    );
  });

  describe("notifyProcessing", () => {
    it("should send a Processing status notification", async () => {
      await notifyProcessing("corr-123");

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          correlationId: "corr-123",
          status: JobStatus.Processing,
        },
        expect.any(Object),
      );
    });
  });

  describe("notifyCompleted", () => {
    it("should send a Completed status notification with resultId", async () => {
      await notifyCompleted("corr-123", "result-456");

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          correlationId: "corr-123",
          status: JobStatus.Completed,
          resultId: "result-456",
        },
        expect.any(Object),
      );
    });
  });

  describe("notifyFailed", () => {
    it("should send a Failed status notification with errorMessage", async () => {
      await notifyFailed("corr-123", "Gemini timed out");

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          correlationId: "corr-123",
          status: JobStatus.Failed,
          errorMessage: "Gemini timed out",
        },
        expect.any(Object),
      );
    });
  });

  it("should propagate the error when axios.post rejects", async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error("Network error"));

    await expect(notifyProcessing("corr-123")).rejects.toThrow("Network error");
  });
});
