
"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { type Employee, type Office } from '@/lib/data';

type EmployeeCardProps = {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  offices: Office[];
  isDragging: boolean;
};

export default function EmployeeCard({ employee, onEdit, offices, isDragging }: EmployeeCardProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
  } = useSortable({
    id: employee.id,
    data: {
      type: 'Employee',
      employee,
    }
  });

  const officeName = offices.find(o => o.id === employee.officeId)?.name || 'N/A';
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  const initials = employee.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-card shadow-sm hover:shadow-md transition-all duration-200 touch-none`}
    >
        <div 
           className="p-3 flex flex-row items-center gap-4"
           {...attributes}
           {...listeners}
        >
            <div className="flex-none">
                <Avatar className="h-10 w-10 bg-primary/20 text-primary font-bold">
                <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex-1">
                <CardTitle className="text-base font-medium">{employee.name}</CardTitle>
                <CardDescription className="text-xs">{officeName}</CardDescription>
            </div>
            <div className="flex gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(employee);
                }}
            >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar Oficina</span>
            </Button>
            </div>
        </div>
    </Card>
  );
}
