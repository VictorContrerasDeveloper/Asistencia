
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Office } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


type DroppableOfficeProps = {
  office: Office;
  children?: React.ReactNode;
  employeeCount: number;
  isOverlay?: boolean;
};

export default function DroppableOffice({ office, children, employeeCount, isOverlay }: DroppableOfficeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: office.id,
    data: {
      type: 'Office',
      office,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
       <Card 
          className={cn("flex flex-col h-full", isOverlay && "shadow-lg")}
          
       >
         <CardHeader className="p-3 cursor-grab" {...attributes} {...listeners}>
           <CardTitle className="text-base truncate">{office.name} ({employeeCount})</CardTitle>
         </CardHeader>
          <CardContent className="p-3 pt-0">
              {children}
           </CardContent>
       </Card>
    </div>
  );
}

