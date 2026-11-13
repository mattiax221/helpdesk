"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/labels";
import type { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";

export type BoardItem = {
  id: string;
  status: TicketStatus;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  slaMinutes: number;
  grade?: number | null;
};

function Column({
  status,
  items,
}: {
  status: TicketStatus;
  items: BoardItem[];
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
            <KanbanCard key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ item }: { item: BoardItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border bg-background p-3 shadow-sm",
        isDragging && "opacity-50",
      )}
      {...attributes}
      {...listeners}
    >
      <Link href={`/student/tickets/${item.id}`} className="block space-y-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <div className="flex flex-wrap gap-1">
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_COLORS[item.priority])}>
            {PRIORITY_LABELS[item.priority]}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {CATEGORY_LABELS[item.category]}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            SLA {item.slaMinutes}m
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map((s) => [s, [] as BoardItem[]])) as Record<
      TicketStatus,
      BoardItem[]
    >;
    for (const item of items) map[item.status].push(item);
    return map;
  }, [items]);

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
      list.map((i) => (i.id === activeItemId ? { ...i, status: nextStatus! } : i)),
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} items={grouped[status]} />
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
  );
}
