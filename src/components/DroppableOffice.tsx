
"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
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
         <CardHeader className="p-3">
           <CardTitle className="text-base truncate">{office.name} ({employeeCount})</CardTitle>
         </CardHeader>
          <CardContent className="p-3 pt-0">
              {children}
           </CardContent>
       </Card>
    </div>
  );
}
