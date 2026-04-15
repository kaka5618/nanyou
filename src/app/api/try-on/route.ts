import { NextResponse } from "next/server";

import {
  ArkImageServiceError,
  generateTryOnImage,
  type ArkImageRequest,
} from "@/services/ark-image";

export const runtime = "nodejs";

const DEFAULT_ARK_URL =
  "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DEFAULT_MODEL = "doubao-seedream-5-0-260128";
const DEFAULT_TIMEOUT_MS = 120_000;

const TRY_ON_PROMPT =
  "图1是人物照，后续图片是待搭配的服装单品（可含上衣、裤子、帽子等）。请为图1人物融合这些服装，保持人物姿态、构图和背景尽量不变，输出真实自然、整体协调的试衣效果图。";

function fileToDataUrl(buf: Buffer, mime: string): string {
  const m = mime || "image/jpeg";
  return `data:${m};base64,${buf.toString("base64")}`;
}

function isMockMode(): boolean {
  const v = process.env.TRY_ON_USE_MOCK;
  if (v === "1" || v === "true") return true;
  if (!process.env.ARK_API_KEY?.trim()) return true;
  return false;
}

function devLogMode(mode: "mock" | "ark-image", reason: string) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[try-on-route]", { mode, reason });
}

async function handleMock(person: File, delayMs: number) {
  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, Math.min(delayMs, 25_000)));
  }
  const buf = Buffer.from(await person.arrayBuffer());
  const mime = person.type || "image/jpeg";
  const base64 = buf.toString("base64");
  return NextResponse.json({
    imageUrl: `data:${mime};base64,${base64}`,
    mock: true,
  });
}

export async function POST(req: Request) {
  const delayMs = Number(process.env.TRY_ON_MOCK_DELAY_MS ?? "0") || 0;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const person = form.get("person");
  const garments = form
    .getAll("garment")
    .filter((f): f is File => f instanceof File);

  if (!(person instanceof File) || garments.length === 0) {
    return NextResponse.json(
      { error: "需要上传人物照片，并至少上传一张服装图片" },
      { status: 400 },
    );
  }

  if (isMockMode()) {
    const forceMock = process.env.TRY_ON_USE_MOCK;
    const reason =
      forceMock === "1" || forceMock === "true"
        ? "TRY_ON_USE_MOCK enabled"
        : "ARK_API_KEY missing";
    devLogMode("mock", reason);
    return handleMock(person, delayMs);
  }

  const apiKey = process.env.ARK_API_KEY!.trim();
  const url = process.env.ARK_IMAGE_API_URL?.trim() || DEFAULT_ARK_URL;
  const model = process.env.ARK_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
  const timeoutMs =
    Number(process.env.ARK_TIMEOUT_MS ?? String(DEFAULT_TIMEOUT_MS)) ||
    DEFAULT_TIMEOUT_MS;

  const personBuf = Buffer.from(await person.arrayBuffer());
  const personMime = person.type || "image/jpeg";
  const garmentDataUrls = await Promise.all(
    garments.map(async (garment) => {
      const garmentBuf = Buffer.from(await garment.arrayBuffer());
      const garmentMime = garment.type || "image/jpeg";
      return fileToDataUrl(garmentBuf, garmentMime);
    }),
  );

  const body: ArkImageRequest = {
    model,
    prompt: TRY_ON_PROMPT,
    image: [fileToDataUrl(personBuf, personMime), ...garmentDataUrls],
    sequential_image_generation: "disabled",
    response_format: "url",
    size: "2K",
    stream: false,
    watermark: true,
  };

  try {
    devLogMode("ark-image", "call ark images/generations");
    const { imageUrl } = await generateTryOnImage(body, {
      apiKey,
      url,
      timeoutMs,
    });
    return NextResponse.json({
      imageUrl,
      mock: false,
    });
  } catch (err) {
    if (err instanceof ArkImageServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: "试衣服务暂时不可用", code: "UPSTREAM" },
      { status: 502 },
    );
  }
}
