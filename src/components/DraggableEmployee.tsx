
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Employee, EmployeeLevel, EmployeeRole } from '@/lib/data';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';


const LevelAbbreviations: Record<EmployeeLevel, string> = {
    'Nivel 1': 'N1.',
    'Nivel 2': 'N2.',
    'Nivel intermedio': 'NIn.',
    'Nivel Básico': 'NB.',
}

const RolePrefixes: Partial<Record<EmployeeRole, string>> = {
    'Supervisión': 'Sup.',
    'Anfitrión': 'Anf.',
    'Tablet': 'Tab.'
};


type DraggableEmployeeProps = {
  employee: Employee;
  isOverlay?: boolean;
  onNameClick?: () => void;
};

export default function DraggableEmployee({ employee, isOverlay, onNameClick }: DraggableEmployeeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: employee.id, data: {type: 'Employee', employee} });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  
  const levelAbbreviation = LevelAbbreviations[employee.level] || 'NB.';
  const rolePrefix = RolePrefixes[employee.role];
  const displayPrefix = rolePrefix ? rolePrefix : levelAbbreviation;


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-1 rounded-md bg-card border border-transparent text-sm font-medium",
        "hover:bg-muted/80",
        isOverlay && "bg-muted shadow-lg",
        isDragging && "cursor-grabbing"
      )}
    >
       <div 
        className="flex items-center gap-2 truncate flex-1 cursor-pointer" 
        onClick={onNameClick}
       >
         <span className="text-muted-foreground font-semibold text-xs w-auto flex-shrink-0">
          {displayPrefix}
         </span>
         <span className="truncate">{employee.name}</span>
       </div>
       <div {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
       </div>
    </div>
  );
}
