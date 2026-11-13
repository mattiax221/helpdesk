import Link from "next/link";
import { GitBranch, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getIncidentChain } from "@/lib/incident-chains";
import { cn } from "@/lib/utils";

export type ChainNode = {
  ticketId: string;
  title: string;
  chainStep: number;
  assignmentId?: string | null;
  current?: boolean;
};

export function IncidentChainBanner({
  chainKey,
  chainStep,
  nodes,
  hrefFor,
  className,
}: {
  chainKey: string;
  chainStep: number;
  nodes: ChainNode[];
  hrefFor?: (node: ChainNode) => string | null;
  className?: string;
}) {
  const chain = getIncidentChain(chainKey);
  if (!chain) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-teal-800/15 bg-gradient-to-br from-teal-50 via-background to-slate-50 p-4 shadow-sm dark:from-teal-950/40 dark:via-background dark:to-slate-950",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
          <GitBranch className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight">Catena incidente · {chain.name}</p>
          <p className="text-xs text-muted-foreground">{chain.blurb}</p>
        </div>
        <Badge variant="outline" className="ml-auto text-[10px]">
          Passo {chainStep + 1}/{chain.steps.length}
        </Badge>
      </div>

      <div className="flex flex-wrap items-stretch gap-2">
        {chain.steps.map((step, idx) => {
          const node = nodes.find((n) => n.chainStep === idx);
          const isCurrent = idx === chainStep;
          const isPast = idx < chainStep;
          const isFuture = idx > chainStep;
          const href = node && hrefFor ? hrefFor(node) : null;

          const card = (
            <div
              className={cn(
                "min-w-[140px] flex-1 rounded-lg border px-3 py-2 transition-colors",
                isCurrent && "border-teal-600 bg-teal-700/10 ring-1 ring-teal-600/30",
                isPast && "border-border/80 bg-muted/40",
                isFuture && "border-dashed opacity-60",
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {step.nodeLabel}
              </p>
              <p className="mt-0.5 text-sm font-medium leading-snug">
                {node?.title || step.title}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {isCurrent ? "Ticket corrente" : isPast ? "A monte" : "In attesa"}
              </p>
            </div>
          );

          return (
            <div key={chain.key + idx} className="flex flex-1 items-center gap-2">
              {href ? (
                <Link href={href} className="flex-1 hover:opacity-90">
                  {card}
                </Link>
              ) : (
                <div className="flex-1">{card}</div>
              )}
              {idx < chain.steps.length - 1 && (
                <ArrowRight className="hidden size-4 shrink-0 text-teal-700/50 sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
