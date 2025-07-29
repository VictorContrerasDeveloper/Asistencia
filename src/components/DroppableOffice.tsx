
"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

type DroppableOfficeProps = {
  id: string;
  children: React.ReactNode;
};

export default function DroppableOffice({ id, children }: DroppableOfficeProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    // border: isOver ? '2px solid hsl(var(--primary))' : undefined,
    boxShadow: isOver ? '0 0 0 2px hsl(var(--primary))' : undefined,
    borderRadius: 'var(--radius)',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}
