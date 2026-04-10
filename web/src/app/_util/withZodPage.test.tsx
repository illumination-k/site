import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
}));

import { withZodPage } from "./withZodPage";

describe("withZodPage", () => {
  afterEach(() => {
    notFoundMock.mockClear();
    vi.unstubAllEnvs();
  });

  it("passes parsed params to the page when validation succeeds", async () => {
    const schema = { params: z.object({ uuid: z.string() }) };
    const page = vi.fn(() => "rendered");

    const wrapped = withZodPage(schema, page);
    const result = await wrapped({
      params: Promise.resolve({ uuid: "abc" }),
    });

    expect(result).toBe("rendered");
    expect(page).toHaveBeenCalledWith({ params: { uuid: "abc" } });
  });

  it("passes through both params and searchParams", async () => {
    const schema = {
      params: z.object({ slug: z.string() }),
      searchParams: z.object({ page: z.coerce.number() }),
    };
    const page = vi.fn(() => null);

    const wrapped = withZodPage(schema, page);
    await wrapped({
      params: Promise.resolve({ slug: "hello" }),
      searchParams: Promise.resolve({ page: "3" }),
    });

    expect(page).toHaveBeenCalledWith({
      params: { slug: "hello" },
      searchParams: { page: 3 },
    });
  });

  it("calls notFound when validation fails and no error handler is provided", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const schema = { params: z.object({ uuid: z.string() }) };
    const page = vi.fn(() => "rendered");

    const wrapped = withZodPage(schema, page);

    await expect(
      wrapped({ params: Promise.resolve({ uuid: 123 }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(page).not.toHaveBeenCalled();
  });

  it("invokes the provided error handler instead of notFound", async () => {
    const schema = { params: z.object({ uuid: z.string() }) };
    const page = vi.fn(() => "rendered");
    const errorHandler = vi.fn(() => "fallback");

    const wrapped = withZodPage(schema, page, { params: errorHandler });
    const result = await wrapped({
      params: Promise.resolve({ uuid: 123 }),
    });

    expect(result).toBe("fallback");
    expect(errorHandler).toHaveBeenCalledOnce();
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(page).not.toHaveBeenCalled();
  });

  it("logs the zod error in development mode", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const schema = { params: z.object({ uuid: z.string() }) };
    const page = vi.fn();

    const wrapped = withZodPage(schema, page);
    await expect(
      wrapped({ params: Promise.resolve({ uuid: 123 }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
