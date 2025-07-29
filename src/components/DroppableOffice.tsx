"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Office, Employee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DroppableOfficeProps = {
  office: Office;
  children?: React.ReactNode;
  employees: Employee[];
  isOverlay?: boolean;
};

export default function DroppableOffice({ office, children, employees, isOverlay }: DroppableOfficeProps) {
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
         <CardHeader className="p-3 space-y-1">
            <CardTitle className="text-base truncate cursor-default">{office.name} ({employees.length})</CardTitle>
         </CardHeader>
          <CardContent className="p-3 pt-0">
              {children}
           </CardContent>
       </Card>
    </div>
  );
}
