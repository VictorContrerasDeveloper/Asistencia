
"use client";

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { type Employee, getOfficeById } from '@/lib/data';
import { useEffect, useState } from 'react';

type EmployeeCardProps = {
  employee: Employee;
  onEdit: (employee: Employee) => void;
};

export default function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: employee.id,
    data: {
      type: 'Employee',
      employee,
    }
  });

  const [officeName, setOfficeName] = useState('Cargando...');

  useEffect(() => {
    const fetchOfficeName = async () => {
      const office = await getOfficeById(employee.officeId);
      setOfficeName(office?.name || 'N/A');
    }
    fetchOfficeName();
  }, [employee.officeId]);


  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const initials = employee.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-card shadow-sm hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing touch-none"
    >
      <CardHeader className="flex flex-row items-center gap-4 p-3">
        <Avatar className="h-10 w-10 bg-primary/20 text-primary font-bold">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
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
      </CardHeader>
    </Card>
  );
}
