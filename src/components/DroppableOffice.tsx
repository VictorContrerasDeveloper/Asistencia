
"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Office } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

type DroppableOfficeProps = {
  office: Office;
  children?: React.ReactNode;
  employeeCount: number;
  isOverlay?: boolean;
  dragHandleProps?: any;
};

export default function DroppableOffice({ office, children, isOverlay, dragHandleProps }: DroppableOfficeProps) {
  const {setNodeRef} = useDroppable({
    id: office.id,
    data: {
      type: 'Office',
      office,
    },
  });


  return (
    <div ref={setNodeRef}>
       <Card 
          className={cn("flex flex-col h-full", isOverlay && "shadow-lg")}
       >
         <CardHeader className="p-3 space-y-1 flex flex-row items-center justify-between cursor-default">
            <CardTitle className="text-base truncate">{office.name}</CardTitle>
            <div {...dragHandleProps} className="cursor-grab p-1">
                <GripVertical className="h-5 w-5 text-muted-foreground/60" />
            </div>
         </CardHeader>
          <CardContent className="p-3 pt-0">
              {children}
           </CardContent>
       </Card>
    </div>
  );
}
