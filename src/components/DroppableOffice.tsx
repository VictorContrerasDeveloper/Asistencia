
"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Office, Employee, EmployeeRole, EmployeeLevel } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const OfficeHeaderSummary = ({ employees }: { employees: Employee[] }) => {
    const supervisorCount = employees.filter(e => e.role === 'Supervisión').length;
    const nivel2Count = employees.filter(e => e.level === 'Nivel 2').length;
    const nivel1Count = employees.filter(e => e.level === 'Nivel 1').length;
    const intermedioCount = employees.filter(e => e.level === 'Nivel intermedio').length;
    const tabletCount = employees.filter(e => e.role === 'Tablet').length;
    const anfitrionCount = employees.filter(e => e.role === 'Anfitrión').length;

    if (employees.length === 0) return null;

    return (
        <div className="text-sm font-normal flex items-center gap-1.5 flex-wrap">
            <span>S: {supervisorCount}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>N2: {nivel2Count}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>N1: {nivel1Count}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Int: {intermedioCount}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>T: {tabletCount}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>A: {anfitrionCount}</span>
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
              <TooltipContent>
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
