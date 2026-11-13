"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, Clock3, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/labels";
import { formatSlaRemaining, getSlaState, type SlaState } from "@/lib/sla";
import type { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";

export type BoardItem = {
  id: string;
  status: TicketStatus;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  slaMinutes: number;
  startedAt?: string | Date | null;
  createdAt?: string | Date | null;
  grade?: number | null;
};

const PRIORITY_FILTERS: Array<TicketPriority | "ALL"> = [
  "ALL",
  "CRITICA",
  "ALTA",
  "MEDIA",
  "BASSA",
];

const SLA_FILTERS: Array<SlaState | "ALL"> = ["ALL", "overdue", "warning", "ok", "done"];

const SLA_FILTER_LABELS: Record<SlaState | "ALL", string> = {
  ALL: "Tutti SLA",
  overdue: "Scaduti",
  warning: "In scadenza",
  ok: "Nei tempi",
  done: "Chiusi/verifica",
};

function Column({
  status,
  items,
  now,
}: {
  status: TicketStatus;
  items: BoardItem[];
  now: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[420px] w-[280px] shrink-0 flex-col rounded-lg border bg-slate-50/80 dark:bg-slate-900/40",
        isOver && "ring-2 ring-teal-600/40",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-medium">{STATUS_LABELS[status]}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} now={now} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ item, now }: { item: BoardItem; now: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const sla = getSlaState(item.status, item.slaMinutes, item.startedAt, item.createdAt, now);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border bg-background p-3 shadow-sm",
        isDragging && "opacity-50",
        sla.state === "overdue" && "border-rose-400/80 ring-1 ring-rose-400/30",
        sla.state === "warning" && "border-amber-400/80 ring-1 ring-amber-400/30",
      )}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/student/tickets/${item.id}`}
        className="block space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <div className="flex flex-wrap gap-1">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              PRIORITY_COLORS[item.priority],
            )}
          >
            {PRIORITY_LABELS[item.priority]}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {CATEGORY_LABELS[item.category]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              sla.state === "overdue" && "border-rose-400 text-rose-700 dark:text-rose-300",
              sla.state === "warning" && "border-amber-400 text-amber-800 dark:text-amber-300",
            )}
          >
            {sla.state === "overdue"
              ? `SLA scaduto ${formatSlaRemaining(sla.remainingMs)}`
              : sla.state === "warning"
                ? `SLA ${formatSlaRemaining(sla.remainingMs)}`
                : sla.state === "done"
                  ? `SLA ${item.slaMinutes}m`
                  : `SLA ${formatSlaRemaining(sla.remainingMs)}`}
          </Badge>
          {typeof item.grade === "number" && (
            <Badge className="text-[10px]">Voto {item.grade}</Badge>
          )}
        </div>
      </Link>
    </div>
  );
}

export function KanbanBoard({ initialItems }: { initialItems: BoardItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const [slaFilter, setSlaFilter] = useState<SlaState | "ALL">("ALL");
  const [now, setNow] = useState(() => Date.now());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const enriched = useMemo(
    () =>
      items.map((item) => ({
        item,
        sla: getSlaState(item.status, item.slaMinutes, item.startedAt, item.createdAt, now),
      })),
    [items, now],
  );

  const overdueCount = enriched.filter((e) => e.sla.state === "overdue").length;
  const warningCount = enriched.filter((e) => e.sla.state === "warning").length;

  const filteredItems = useMemo(() => {
    return enriched
      .filter(({ item, sla }) => {
        if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;
        if (slaFilter !== "ALL" && sla.state !== slaFilter) return false;
        return true;
      })
      .map(({ item }) => item);
  }, [enriched, priorityFilter, slaFilter]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map((s) => [s, [] as BoardItem[]])) as Record<
      TicketStatus,
      BoardItem[]
    >;
    for (const item of filteredItems) map[item.status].push(item);
    return map;
  }, [filteredItems]);

  const activeItem = items.find((i) => i.id === activeId) || null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overId = String(over.id);
    const current = items.find((i) => i.id === activeItemId);
    if (!current) return;

    let nextStatus: TicketStatus | null = null;
    if (STATUS_ORDER.includes(overId as TicketStatus)) {
      nextStatus = overId as TicketStatus;
    } else {
      const overItem = items.find((i) => i.id === overId);
      nextStatus = overItem?.status ?? null;
    }
    if (!nextStatus || nextStatus === current.status) return;

    if (
      (nextStatus === "WAITING_REVIEW" || nextStatus === "RESOLVED") &&
      current.status !== "WAITING_REVIEW" &&
      current.status !== "RESOLVED"
    ) {
      toast.message("Apri il ticket e compila i campi di chiusura prima di inviarlo in verifica.");
      router.push(`/student/tickets/${current.id}`);
      return;
    }

    const prev = items;
    setItems((list) =>
      list.map((i) =>
        i.id === activeItemId
          ? {
              ...i,
              status: nextStatus!,
              startedAt:
                nextStatus === "IN_PROGRESS" && !i.startedAt ? new Date().toISOString() : i.startedAt,
            }
          : i,
      ),
    );

    const res = await fetch(`/api/assignments/${activeItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      setItems(prev);
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Spostamento non riuscito");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {(overdueCount > 0 || warningCount > 0) && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm",
            overdueCount > 0
              ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
              : "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
          )}
        >
          {overdueCount > 0 ? (
            <AlertTriangle className="size-4 shrink-0" />
          ) : (
            <Clock3 className="size-4 shrink-0" />
          )}
          <span>
            {overdueCount > 0 && (
              <>
                <strong>{overdueCount}</strong> ticket con SLA scaduto
                {warningCount > 0 ? " · " : ""}
              </>
            )}
            {warningCount > 0 && (
              <>
                <strong>{warningCount}</strong> in scadenza
              </>
            )}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => setSlaFilter(overdueCount > 0 ? "overdue" : "warning")}
          >
            Mostra solo questi
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Filter className="size-3.5" />
          Filtri
        </span>
        {PRIORITY_FILTERS.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={priorityFilter === p ? "default" : "outline"}
            className={cn(priorityFilter === p && "bg-teal-700 hover:bg-teal-800")}
            onClick={() => setPriorityFilter(p)}
          >
            {p === "ALL" ? "Tutte priorità" : PRIORITY_LABELS[p]}
          </Button>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        {SLA_FILTERS.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={slaFilter === s ? "default" : "outline"}
            className={cn(slaFilter === s && "bg-teal-700 hover:bg-teal-800")}
            onClick={() => setSlaFilter(s)}
          >
            {SLA_FILTER_LABELS[s]}
          </Button>
        ))}
        {(priorityFilter !== "ALL" || slaFilter !== "ALL") && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setPriorityFilter("ALL");
              setSlaFilter("ALL");
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => (
            <Column key={status} status={status} items={grouped[status]} now={now} />
          ))}
        </div>
        <DragOverlay>
          {activeItem ? (
            <div className="w-[260px] rounded-md border bg-background p-3 shadow-lg">
              <p className="text-sm font-medium">{activeItem.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
