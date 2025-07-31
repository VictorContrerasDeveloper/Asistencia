
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Employee, EmployeeLevel, EmployeeRole, AbsenceReason } from '@/lib/data';
import { GripVertical, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


const LevelAbbreviations: Record<EmployeeLevel, string> = {
    'Nivel 1': 'Ej1.',
    'Nivel 2': 'Ej2.',
    'Nivel intermedio': 'Int.',
    'Nivel Básico': 'Basic.',
}

const RolePrefixes: Partial<Record<EmployeeRole, string>> = {
    'Supervisión': 'Sup.',
    'Anfitrión': 'Anf.',
    'Tablet': 'Tab.'
};

const PROLONGED_ABSENCE_REASONS: AbsenceReason[] = ['Licencia médica', 'Vacaciones', 'Otro'];


type DraggableEmployeeProps = {
  employee: Employee;
  isOverlay?: boolean;
  onNameClick?: () => void;
  isUpdating?: boolean;
};

export default function DraggableEmployee({ employee, isOverlay, onNameClick, isUpdating }: DraggableEmployeeProps) {
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
  
  const levelAbbreviation = LevelAbbreviations[employee.level] || 'Basic.';
  const rolePrefix = RolePrefixes[employee.role];
  const displayPrefix = rolePrefix ? rolePrefix : levelAbbreviation;
  
  const isProlongedAbsence = PROLONGED_ABSENCE_REASONS.includes(employee.absenceReason);
  const isDailyAbsence = employee.absenceReason === 'Inasistencia';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-1 rounded-md bg-card border border-transparent text-sm font-medium",
        "hover:bg-muted/80",
        isOverlay && "bg-muted shadow-lg",
        isDragging && "cursor-grabbing",
        isProlongedAbsence && "text-red-600 dark:text-red-500 italic",
        isDailyAbsence && "text-muted-foreground italic"
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
       {isUpdating ? (
          <Loader2 className="h-4 w-4 text-muted-foreground/50 animate-spin" />
        ) : (
          <div {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
          </div>
        )}
    </div>
  );
}
