
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Employee, EmployeeLevel, EmployeeRole } from '@/lib/data';
import { GripVertical, Shield, Tablet, User } from 'lucide-react';
import { cn } from '@/lib/utils';


const DesktopIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        {...props}
    >
        <path d="M4 3C2.89543 3 2 3.89543 2 5V10C2 11.1046 2.89543 12 4 12H20C21.1046 12 22 11.1046 22 10V5C22 3.89543 21.1046 3 20 3H4ZM4 5H20V10H4V5Z" />
        <path d="M3 14C1.89543 14 1 14.8954 1 16V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V16C23 14.8954 22.1046 14 21 14H3ZM3 16H21V19H3V16Z" />
        <path d="M6 17C5.44772 17 5 17.4477 5 18C5 18.5523 5.44772 19 6 19H8C8.55228 19 9 18.5523 9 18C9 17.4477 8.55228 17 8 17H6Z" />
        <path d="M11 17C10.4477 17 10 17.4477 10 18C10 18.5523 10.4477 19 11 19H13C13.5523 19 14 18.5523 14 18C14 17.4477 13.5523 17 13 17H11Z" />
    </svg>
);

const RoleIcons: Record<EmployeeRole, React.ElementType> = {
    'Supervisión': Shield,
    'Modulo': DesktopIcon,
    'Tablet': Tablet,
    'Anfitrión': User,
}

const LevelAbbreviations: Record<EmployeeLevel, string> = {
    'Nivel 1': 'N1.',
    'Nivel 2': 'N2.',
    'Nivel intermedio': 'NIn.',
    'Nivel Básico': 'NB.',
}


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
  
  const RoleIcon = RoleIcons[employee.role] || User;
  const levelAbbreviation = LevelAbbreviations[employee.level] || 'NB.';


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
         <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
         <span className="text-muted-foreground font-semibold text-xs w-6">{levelAbbreviation}</span>
         <span className="truncate">{employee.name}</span>
       </div>
       <div {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
       </div>
    </div>
  );
}
