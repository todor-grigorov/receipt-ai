import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should export valid config when all environment variables are present and valid", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.ASPNET_API_URL = "http://localhost:5000";
    process.env.ASPNET_API_KEY = "test-internal-key";

    const { config } = await import("../src/config");

    expect(config.GEMINI_API_KEY).toBe("test-gemini-key");
    expect(config.DATABASE_URL).toBe(
      "postgresql://user:pass@localhost:5432/db",
    );
    expect(config.ASPNET_API_URL).toBe("http://localhost:5000");
    expect(config.ASPNET_API_KEY).toBe("test-internal-key");
  });

  it("should call process.exit(1) when GEMINI_API_KEY is missing", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    delete process.env.GEMINI_API_KEY;
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.ASPNET_API_URL = "http://localhost:5000";
    process.env.ASPNET_API_KEY = "test-internal-key";

    await import("../src/config");

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should call process.exit(1) when DATABASE_URL is empty", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.DATABASE_URL = "";
    process.env.ASPNET_API_URL = "http://localhost:5000";
    process.env.ASPNET_API_KEY = "test-internal-key";

    await import("../src/config");

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should call process.exit(1) when ASPNET_API_URL is not a valid URL", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.ASPNET_API_URL = "not-a-valid-url";
    process.env.ASPNET_API_KEY = "test-internal-key";

    await import("../src/config");

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should call process.exit(1) when ASPNET_API_KEY is missing", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.ASPNET_API_URL = "http://localhost:5000";
    delete process.env.ASPNET_API_KEY;

    await import("../src/config");

    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should log the validation error details to console.error before exiting", async () => {
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    delete process.env.GEMINI_API_KEY;

    await import("../src/config");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:\n",
      expect.stringContaining("GEMINI_API_KEY"),
    );

    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
