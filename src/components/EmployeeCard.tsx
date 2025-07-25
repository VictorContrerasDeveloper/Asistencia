"use client";

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { type Employee, getOffices } from '@/lib/data';

type EmployeeCardProps = {
  employee: Employee;
  onEdit: (employee: Employee) => void;
};

export default function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: employee.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const officeName = getOffices().find(o => o.id === employee.officeId)?.name || 'N/A';
  const initials = employee.name.split(' ').map(n => n[0]).join('');

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-card shadow-sm hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing touch-none"
    >
      <CardHeader className="flex flex-row items-center gap-4 p-3 relative">
        <Avatar>
          <AvatarImage src={`https://placehold.co/40x40.png?text=${initials}`} alt={employee.name} data-ai-hint="person portrait" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-base font-medium">{employee.name}</CardTitle>
          <CardDescription className="text-xs">{officeName}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 absolute top-2 right-2"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(employee);
          }}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar Oficina</span>
        </Button>
      </CardHeader>
    </Card>
  );
}
