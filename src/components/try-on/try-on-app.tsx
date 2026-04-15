"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Download,
  FileText,
  ImagePlus,
  Loader2,
  RefreshCw,
  Share2,
  Shirt,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { compressImageFile } from "@/lib/compress-image";
import { applyWatermark } from "@/lib/watermark";
import { useTryOnStore } from "@/store/tryon-store";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME ?? "试衣";

export function TryOnApp() {
  const personInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const {
    personPreview,
    garmentPreviews,
    personFile,
    garmentFiles,
    results,
    activeResultId,
    setPerson,
    addGarments,
    removeGarmentAt,
    clearGarments,
    addResult,
    setActiveResult,
    resetSession,
  } = useTryOnStore();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevPersonBlob = useRef<string | null>(null);
  const prevGarmentBlobs = useRef<string[]>([]);

  const revokeIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const clearGarmentsOnly = useCallback(() => {
    for (const url of prevGarmentBlobs.current) {
      revokeIfBlob(url);
    }
    prevGarmentBlobs.current = [];
    clearGarments();
  }, [clearGarments, revokeIfBlob]);

  const onPickPerson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    revokeIfBlob(prevPersonBlob.current);
    const compressed = await compressImageFile(file);
    const url = URL.createObjectURL(compressed);
    prevPersonBlob.current = url;
    setPerson(compressed, url);
  };

  const onPickGarment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    setError(null);
    const nextItems: Array<{ file: File; preview: string }> = [];
    for (const file of picked) {
      const compressed = await compressImageFile(file);
      const url = URL.createObjectURL(compressed);
      prevGarmentBlobs.current.push(url);
      nextItems.push({ file: compressed, preview: url });
    }
    addGarments(nextItems);
  };

  useEffect(() => {
    return () => {
      revokeIfBlob(prevPersonBlob.current);
      for (const url of prevGarmentBlobs.current) {
        revokeIfBlob(url);
      }
    };
  }, [revokeIfBlob]);

  const activeResult = useMemo(() => {
    if (!results.length) return null;
    if (activeResultId) {
      const hit = results.find((r) => r.id === activeResultId);
      if (hit) return hit;
    }
    return results[results.length - 1];
  }, [results, activeResultId]);

  const canGenerate = Boolean(personFile && garmentFiles.length > 0 && !busy);

  const generate = async () => {
    if (!personFile || garmentFiles.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("person", personFile);
      for (const garmentFile of garmentFiles) {
        fd.append("garment", garmentFile);
      }

      const res = await fetch("/api/try-on", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        imageUrl?: string;
        text?: string;
        error?: string;
        mock?: boolean;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "生成失败，请稍后重试");
      }
      if (data.mock) {
        throw new Error(
          "当前处于 Mock 模式（未配置 ARK_API_KEY 或启用了 TRY_ON_USE_MOCK），请先配置服务端环境变量。",
        );
      }

      const text = data.text?.trim();
      if (data.imageUrl) {
        let marked = data.imageUrl;
        try {
          marked = await applyWatermark(data.imageUrl, [
            BRAND,
            `由 ${BRAND} AI 试衣生成`,
          ]);
        } catch {
          // 部分外链图片无 CORS 头，无法在 canvas 中二次处理；回退为原图展示
          marked = data.imageUrl;
        }
        addResult({ imageUrl: marked, text: text || undefined });
      } else if (text) {
        addResult({ text });
      } else {
        throw new Error("服务未返回可用结果");
      }
      clearGarmentsOnly();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy(false);
    }
  };

  const downloadActive = () => {
    if (!activeResult) return;
    const a = document.createElement("a");
    if (activeResult.imageUrl) {
      a.href = activeResult.imageUrl;
      a.download = `tryon-${activeResult.id.slice(0, 8)}.png`;
    } else if (activeResult.text) {
      const blob = new Blob([activeResult.text], {
        type: "text/plain;charset=utf-8",
      });
      a.href = URL.createObjectURL(blob);
      a.download = `tryon-${activeResult.id.slice(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    } else {
      return;
    }
    a.click();
  };

  const sharePage = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("ref", "share");
    const text = `${BRAND} · AI 试穿预览`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, url: url.toString() });
        return;
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(url.toString());
      setError(null);
      alert("链接已复制，可粘贴到微信或社交平台分享。");
    } catch {
      setError("无法复制链接，请手动复制地址栏链接。");
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {BRAND}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          AI 试穿预览
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          上传你的照片与一件服装图，约 10～20 秒生成购买前参考图。无需登录；刷新页面会清空本次会话。
        </p>
      </header>

      <section className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">使用说明：</strong>
        人物照需含
        <span className="text-foreground">肩部以上躯干</span>
        ，不建议纯头像特写；服装图可为商品图、平铺或截图。可一次上传多件单品（如上衣/裤子/帽子）。
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. 人物照片</CardTitle>
            <CardDescription>
              会话内只需上传一次，可连续试多件服装。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={personInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPerson}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => personInputRef.current?.click()}
              >
                <UserRound className="opacity-80" />
                {personPreview ? "更换照片" : "上传照片"}
              </Button>
            </div>
            {personPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={personPreview}
                alt="人物预览"
                className="max-h-64 w-full rounded-md object-contain"
              />
            ) : (
              <button
                type="button"
                onClick={() => personInputRef.current?.click()}
                className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground"
              >
                <Camera className="size-8 opacity-60" />
                点击上传
              </button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. 服装图片</CardTitle>
            <CardDescription>每次试穿选择一件上装、下装或连衣裙。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={garmentInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPickGarment}
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!personPreview}
              onClick={() => garmentInputRef.current?.click()}
            >
              <Shirt className="opacity-80" />
              {garmentPreviews.length > 0 ? "继续添加服装图" : "上传服装图"}
            </Button>
            {garmentPreviews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {garmentPreviews.map((preview, idx) => (
                  <div key={`${preview}-${idx}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`服装预览${idx + 1}`}
                      className="h-20 w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 rounded bg-black/55 px-1 text-[10px] text-white"
                      onClick={() => {
                        revokeIfBlob(preview);
                        prevGarmentBlobs.current = prevGarmentBlobs.current.filter(
                          (x) => x !== preview,
                        );
                        removeGarmentAt(idx);
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed bg-muted/20 text-xs text-muted-foreground">
                请先完成人物照片
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="space-y-2">
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={!canGenerate}
          onClick={() => void generate()}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              生成中…
            </>
          ) : (
            <>
              <ImagePlus />
              生成试穿预览
            </>
          )}
        </Button>
        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : null}
      </div>

      {results.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">试穿结果</CardTitle>
            <CardDescription>
              {activeResult?.imageUrl
                ? "AI 预览图仅供参考，不表示尺码、面料或真实上身效果。"
                : "以下为模型根据两张图给出的文字分析，仅供参考。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeResult?.text ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
                {activeResult.text}
              </div>
            ) : null}
            {activeResult?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeResult.imageUrl}
                alt="试穿结果"
                className="w-full rounded-md border bg-black/5"
              />
            ) : null}

            {results.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveResult(r.id)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-muted ${
                      activeResult?.id === r.id
                        ? "border-primary"
                        : "border-transparent opacity-80"
                    }`}
                  >
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <FileText className="size-5 opacity-70" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={downloadActive}
              >
                <Download />
                {activeResult?.imageUrl ? "保存图片" : "保存文字"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => void sharePage()}
              >
                <Share2 />
                分享
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                clearGarmentsOnly();
                garmentInputRef.current?.focus();
              }}
            >
              <RefreshCw />
              清空服装并重选
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <footer className="mt-auto flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground">
        <p>
          生成结果为「AI 试穿预览图」，不承诺精准尺码、垂感纹理或与实物完全一致。请勿用于违法或侵权用途。
        </p>
        <button
          type="button"
          className="self-start text-left underline underline-offset-2"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              !window.confirm("确定清空本会话？人物照片与结果都会删除。")
            ) {
              return;
            }
            revokeIfBlob(personPreview);
            for (const url of garmentPreviews) {
              revokeIfBlob(url);
            }
            prevPersonBlob.current = null;
            prevGarmentBlobs.current = [];
            resetSession();
          }}
        >
          清空本会话
        </button>
      </footer>
    </div>
  );
}
