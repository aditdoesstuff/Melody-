"use client";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "@/lib/store";

function Row({ id, rank }: { id: string; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card flex items-center gap-3 p-4 touch-none select-none ${isDragging ? "shadow-xl border-accent z-10 relative" : ""}`} {...attributes} {...listeners}>
      <span className="h-serif text-2xl w-8 text-accent">{rank}</span>
      <span className="font-semibold flex-1">{id}</span>
      <span aria-hidden className="text-muted text-xl">⋮⋮</span>
    </li>
  );
}

export default function Priorities() {
  const { priorities, setPriorities } = useApp();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setPriorities(arrayMove(priorities, priorities.indexOf(String(e.active.id)), priorities.indexOf(String(e.over.id))));
  };
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="eyebrow">Priorities</p>
        <h1 className="h-serif text-3xl">Decide what matters before the money moves.</h1>
        <p className="text-muted text-sm mt-1">Drag to rank. Top of the list gets the biggest share of the budget. (Keyboard: focus a row, press space, use arrows.)</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={priorities} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">{priorities.map((p, i) => <Row key={p} id={p} rank={i + 1} />)}</ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
