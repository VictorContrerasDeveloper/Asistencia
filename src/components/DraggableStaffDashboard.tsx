
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
  DragStartEvent,
  DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Office, Employee, EmployeeRole, updateEmployee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  const officeMap = useMemo(() => new Map(offices.map(o => [o.id, o])), [offices]);
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

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
     setActiveId(null);
    const { active, over } = event;

    if (!over) return;
    
    const activeEmployee = employeeMap.get(active.id as string);
    if (!activeEmployee) return;

    // Find the target office
    let targetOfficeId: string | null = null;
    if (officeMap.has(over.id as string)) {
        targetOfficeId = over.id as string;
    } else {
        const overEmployee = employeeMap.get(over.id as string);
        if (overEmployee) {
            targetOfficeId = overEmployee.officeId;
        }
    }
    
    if (!targetOfficeId || !officeMap.has(targetOfficeId)) return;


    if (activeEmployee.officeId !== targetOfficeId) {
        const originalEmployees = [...employees];
        
        const updatedEmployee = { ...activeEmployee, officeId: targetOfficeId };

        // Optimistic update
        const newEmployees = employees.map(e => e.id === active.id ? updatedEmployee : e);
        setEmployees(newEmployees);
        
        try {
          await updateEmployee(active.id as string, { officeId: targetOfficeId });
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
  };
  
  const activeEmployee = useMemo(() => employees.find(e => e.id === activeId), [activeId, employees]);

  const sortedOffices = useMemo(() => {
    return [...offices]
      .filter(o => !o.name.toLowerCase().includes('movil'))
      .sort((a, b) => {
        const countA = employeesByOffice[a.id]?.length || 0;
        const countB = employeesByOffice[b.id]?.length || 0;
        return countB - countA;
      });
  }, [offices, employeesByOffice]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 items-start">
        {sortedOffices.map(office => (
          <DroppableOffice key={office.id} id={office.id}>
             <Card className="flex flex-col h-full">
               <CardHeader className="p-3">
                 <CardTitle className="text-base truncate">{office.name} ({employeesByOffice[office.id]?.length || 0})</CardTitle>
               </CardHeader>
                <CardContent className="p-3 pt-0">
                    <SortableContext
                        items={(employeesByOffice[office.id] || []).map(e => e.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1">
                            {(employeesByOffice[office.id] || []).map(employee => (
                                <DraggableEmployee key={employee.id} employee={employee} />
                            ))}
                        </div>
                    </SortableContext>
                    {(employeesByOffice[office.id] || []).length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            Sin personal
                        </div>
                    )}
                 </CardContent>
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
