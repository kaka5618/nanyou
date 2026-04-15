import type { ArkImageGenerationBody } from "@/types/ark-image";

const LOG_PREFIX = "[ark-image]";

export type ArkImageRequest = {
  model: string;
  prompt: string;
  image: string[];
  sequential_image_generation: "disabled";
  response_format: "url";
  size: "2K";
  stream: false;
  watermark: true;
};

export class ArkImageServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code:
      | "UNAUTHORIZED"
      | "RATE_LIMIT"
      | "TIMEOUT"
      | "BAD_RESPONSE"
      | "UPSTREAM",
  ) {
    super(message);
    this.name = "ArkImageServiceError";
  }
}

function devLog(message: string, extra?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  if (extra) {
    console.info(LOG_PREFIX, message, extra);
  } else {
    console.info(LOG_PREFIX, message);
  }
}

function warnLog(message: string, extra?: Record<string, unknown>) {
  if (extra) {
    console.warn(LOG_PREFIX, message, extra);
  } else {
    console.warn(LOG_PREFIX, message);
  }
}

export async function generateTryOnImage(
  payload: ArkImageRequest,
  options: {
    apiKey: string;
    url: string;
    timeoutMs: number;
  },
): Promise<{ imageUrl: string }> {
  const { apiKey, url, timeoutMs } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  devLog("request start", {
    model: payload.model,
    timeoutMs,
    imageCount: payload.image.length,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - started;
    const raw = await res.text();
    let json: unknown = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      warnLog("non-json body", { status: res.status, elapsedMs });
    }

    const body = json as ArkImageGenerationBody | null;

    if (res.status === 401) {
      warnLog("401 unauthorized", { elapsedMs });
      throw new ArkImageServiceError(
        "鉴权失败，请检查服务端 ARK_API_KEY 配置",
        401,
        "UNAUTHORIZED",
      );
    }

    if (res.status === 429) {
      warnLog("429 rate limited", { elapsedMs });
      throw new ArkImageServiceError(
        "请求过于频繁，请稍后重试",
        429,
        "RATE_LIMIT",
      );
    }

    if (!res.ok) {
      const message =
        body?.error?.message ?? (raw ? raw.slice(0, 200) : `HTTP ${res.status}`);
      warnLog("upstream error", { status: res.status, elapsedMs });
      throw new ArkImageServiceError(
        message || "上游图像服务错误",
        res.status,
        "UPSTREAM",
      );
    }

    const imageUrl = body?.data?.[0]?.url;
    if (!imageUrl) {
      warnLog("empty image url", { elapsedMs });
      throw new ArkImageServiceError("模型未返回图片地址", 502, "BAD_RESPONSE");
    }

    devLog("request ok", {
      elapsedMs,
      outputSize: body?.data?.[0]?.size,
    });

    return { imageUrl };
  } catch (err) {
    if (err instanceof ArkImageServiceError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      warnLog("timeout", { timeoutMs });
      throw new ArkImageServiceError("请求超时，请稍后重试", 504, "TIMEOUT");
    }

    warnLog("unexpected error", {
      name: err instanceof Error ? err.name : typeof err,
    });
    throw new ArkImageServiceError(
      err instanceof Error ? err.message : "未知错误",
      500,
      "UPSTREAM",
    );
  } finally {
    clearTimeout(timeout);
  }
}

