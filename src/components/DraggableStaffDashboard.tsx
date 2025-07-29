
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  UniqueIdentifier,
  DragStartEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Office, Employee, EmployeeRole, updateEmployee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import DroppableOffice from './DroppableOffice';
import DraggableEmployee from './DraggableEmployee';

type DraggableStaffDashboardProps = {
  offices: Office[];
  employees: Employee[];
  onEmployeeUpdate: (employee: Employee) => void;
};

const ROLE_ORDER: Record<EmployeeRole, number> = {
    'Supervisión': 1,
    'Modulo': 2,
    'Tablet': 3,
    'Anfitrión': 4,
};

export default function DraggableStaffDashboard({ offices, employees: initialEmployees, onEmployeeUpdate }: DraggableStaffDashboardProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const employeesByOffice = useMemo(() => {
    const grouped: Record<string, Employee[]> = {};
    offices.forEach(office => {
        grouped[office.id] = [];
    });
    employees.forEach(emp => {
      if (grouped[emp.officeId]) {
        grouped[emp.officeId].push(emp);
      }
    });
    // Sort employees within each office
    for (const officeId in grouped) {
        grouped[officeId].sort((a, b) => {
            const roleA = ROLE_ORDER[a.role] || 99;
            const roleB = ROLE_ORDER[b.role] || 99;
            if(roleA !== roleB) {
                return roleA - roleB;
            }
            return a.name.localeCompare(b.name);
        });
    }
    return grouped;
  }, [employees, offices]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const activeEmployee = employees.find(e => e.id === active.id);
      
      // over.id will be the officeId from DroppableOffice
      const newOfficeId = over.id as string; 
      
      if (activeEmployee && activeEmployee.officeId !== newOfficeId) {
        const originalEmployees = employees;
        
        // Optimistic update
        const updatedEmployee = { ...activeEmployee, officeId: newOfficeId };
        setEmployees(prev => prev.map(e => e.id === active.id ? updatedEmployee : e));
        
        try {
          await updateEmployee(active.id as string, { officeId: newOfficeId });
          onEmployeeUpdate(updatedEmployee);
           toast({
                title: "Reasignación Exitosa",
                description: `${activeEmployee.name} ha sido movido/a de oficina.`,
                duration: 2000,
           });
        } catch (error) {
          // Revert on error
          setEmployees(originalEmployees);
          toast({
            title: "Error de Reasignación",
            description: `No se pudo mover a ${activeEmployee.name}.`,
            variant: "destructive",
          });
        }
      }
    }
  };
  
  const activeEmployee = useMemo(() => employees.find(e => e.id === activeId), [activeId, employees]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 items-start">
        {offices.filter(o => !o.name.toLowerCase().includes('movil')).map(office => (
          <DroppableOffice key={office.id} id={office.id}>
             <Card className="flex flex-col h-full">
               <CardHeader className="p-3">
                 <CardTitle className="text-base truncate">{office.name} ({employeesByOffice[office.id]?.length || 0})</CardTitle>
               </CardHeader>
               <ScrollArea className="h-96">
                <CardContent className="p-3 pt-0 space-y-1">
                    <SortableContext
                        items={(employeesByOffice[office.id] || []).map(e => e.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {(employeesByOffice[office.id] || []).map(employee => (
                            <DraggableEmployee key={employee.id} employee={employee} />
                        ))}
                    </SortableContext>
                    {(employeesByOffice[office.id] || []).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            Sin personal
                        </div>
                    )}
                 </CardContent>
               </ScrollArea>
             </Card>
          </DroppableOffice>
        ))}
      </div>
      <DragOverlay>
        {activeId && activeEmployee ? (
          <DraggableEmployee employee={activeEmployee} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
