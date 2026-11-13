"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileCode2,
  Paperclip,
  Download,
  Eye,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AttachmentItem = {
  name: string;
  type?: string;
  content?: string;
  sizeLabel?: string;
  kind?: "log" | "image" | "config" | "other";
};

function inferKind(name: string, type?: string): AttachmentItem["kind"] {
  const lower = name.toLowerCase();
  if (type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(lower)) return "image";
  if (/\.(log|txt)$/i.test(lower) || type?.includes("text")) return "log";
  if (/\.(conf|cfg|ini|json|yml|yaml|xml)$/i.test(lower)) return "config";
  return "other";
}

function iconFor(kind: AttachmentItem["kind"]) {
  switch (kind) {
    case "image":
      return ImageIcon;
    case "config":
      return FileCode2;
    case "log":
      return FileText;
    default:
      return Paperclip;
  }
}

function fakeSize(name: string, content?: string): string {
  if (content) {
    const kb = Math.max(1, Math.round(content.length / 40));
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }
  const n = name.length * 37;
  return `${(n % 900) + 12} KB`;
}

export function AttachmentsPanel({
  logs,
  attachmentsMeta,
}: {
  logs: { name: string; content: string }[];
  attachmentsMeta?: { name: string; type?: string }[];
}) {
  const items = useMemo(() => {
    const map = new Map<string, AttachmentItem>();
    for (const log of logs) {
      map.set(log.name, {
        name: log.name,
        content: log.content,
        type: "text/plain",
        kind: inferKind(log.name, "text/plain"),
        sizeLabel: fakeSize(log.name, log.content),
      });
    }
    for (const meta of attachmentsMeta || []) {
      const existing = map.get(meta.name);
      if (existing) {
        existing.type = meta.type || existing.type;
        existing.kind = inferKind(meta.name, meta.type);
      } else {
        map.set(meta.name, {
          name: meta.name,
          type: meta.type,
          kind: inferKind(meta.name, meta.type),
          sizeLabel: fakeSize(meta.name),
        });
      }
    }
    return [...map.values()];
  }, [logs, attachmentsMeta]);

  const [active, setActive] = useState<AttachmentItem | null>(null);

  function downloadFake(item: AttachmentItem) {
    const body = item.content || `HelpDesk Lab attachment stub\nFile: ${item.name}\n`;
    const blob = new Blob([body], { type: item.type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun allegato tecnico.</p>;
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = iconFor(item.kind);
          return (
            <div
              key={item.name}
              className={cn(
                "flex items-start gap-3 rounded-md border bg-background p-3",
                item.kind === "image" && "border-sky-300/60",
              )}
            >
              <span className="rounded-md bg-slate-100 p-2 dark:bg-slate-900">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-medium">{item.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {item.kind === "image"
                      ? "Screenshot"
                      : item.kind === "config"
                        ? "Config"
                        : item.kind === "log"
                          ? "Log"
                          : "File"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {item.sizeLabel}
                  </Badge>
                </div>
                <div className="mt-2 flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setActive(item)}
                  >
                    <Eye className="mr-1 size-3" />
                    Apri
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => downloadFake(item)}
                  >
                    <Download className="mr-1 size-3" />
                    Scarica
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{active?.name}</DialogTitle>
          </DialogHeader>
          {active?.kind === "image" && !active.content ? (
            <div className="flex aspect-video items-center justify-center rounded-md border bg-gradient-to-br from-slate-200 to-slate-400 text-sm text-slate-700 dark:from-slate-800 dark:to-slate-950 dark:text-slate-300">
              <div className="text-center">
                <ImageIcon className="mx-auto mb-2 size-8 opacity-70" />
                <p>Screenshot simulato</p>
                <p className="text-xs opacity-70">{active.name}</p>
              </div>
            </div>
          ) : (
            <pre className="max-h-[50vh] overflow-auto rounded-md bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
              {active?.content || "(contenuto non disponibile — allegato fittizio)"}
            </pre>
          )}
          <div className="flex justify-end gap-2">
            {active && (
              <Button type="button" variant="outline" size="sm" onClick={() => downloadFake(active)}>
                <Download className="mr-1 size-3.5" />
                Scarica
              </Button>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={() => setActive(null)}>
              <X className="mr-1 size-3.5" />
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
