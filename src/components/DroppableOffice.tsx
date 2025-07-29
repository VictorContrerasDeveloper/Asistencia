
"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Office, Employee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Label } from './ui/label';

const OfficeHeaderSummary = ({ employees }: { employees: Employee[] }) => {
    const supervisorCount = employees.filter(e => e.role === 'Supervisión').length;
    const nivel2Count = employees.filter(e => e.level === 'Nivel 2').length;
    const nivel1Count = employees.filter(e => e.level === 'Nivel 1').length;
    const intermedioCount = employees.filter(e => e.level === 'Nivel intermedio').length;
    const tabletCount = employees.filter(e => e.role === 'Tablet').length;
    const anfitrionCount = employees.filter(e => e.role === 'Anfitrión').length;

    if (employees.length === 0) return null;

    const summaryItems = [
      { label: 'Supervisores', count: supervisorCount },
      { label: 'Nivel 2', count: nivel2Count },
      { label: 'Nivel 1', count: nivel1Count },
      { label: 'Nivel Intermedio', count: intermedioCount },
      { label: 'Tablet', count: tabletCount },
      { label: 'Anfitrión', count: anfitrionCount },
    ];

    return (
        <div className="p-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {summaryItems.map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <Label className="text-xs">{item.label}:</Label>
              <span className="font-bold text-xs">{item.count}</span>
            </div>
          ))}
        </div>
    )
}


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
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-base truncate cursor-default">{office.name} ({employees.length})</CardTitle>
              </TooltipTrigger>
              <TooltipContent className="p-0">
                <OfficeHeaderSummary employees={employees} />
              </TooltipContent>
            </Tooltip>
         </CardHeader>
          <CardContent className="p-3 pt-0">
              {children}
           </CardContent>
       </Card>
    </div>
  );
}
