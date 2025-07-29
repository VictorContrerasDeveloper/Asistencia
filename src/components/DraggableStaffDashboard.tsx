
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
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Office, Employee, EmployeeRole, EmployeeLevel, updateEmployee } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import DroppableOffice from './DroppableOffice';
import DraggableEmployee from './DraggableEmployee';
import EditEmployeeModal from './EditEmployeeModal';


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

const LEVEL_ORDER: Record<EmployeeLevel, number> = {
    'Nivel 2': 1,
    'Nivel 1': 2,
    'Nivel intermedio': 3,
    'Nivel Básico': 4,
};

export default function DraggableStaffDashboard({ 
  offices: initialOffices, 
  employees: initialEmployees, 
  onEmployeeUpdate,
}: DraggableStaffDashboardProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [offices, setOffices] = useState(initialOffices);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  useEffect(() => {
    setOffices(initialOffices);
  }, [initialOffices]);
  
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
    for (const officeId in grouped) {
        grouped[officeId].sort((a, b) => {
            const roleA = ROLE_ORDER[a.role] || 99;
            const roleB = ROLE_ORDER[b.role] || 99;
            if(roleA !== roleB) {
                return roleA - roleB;
            }
            
            const levelA = LEVEL_ORDER[a.level || 'Nivel Básico'] || 99;
            const levelB = LEVEL_ORDER[b.level || 'Nivel Básico'] || 99;

            if (levelA !== levelB) {
                return levelA - levelB;
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
    
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    
    const activeIsEmployee = employeeMap.has(activeIdStr);
    
    if (!activeIsEmployee) return;

    const activeEmployee = employeeMap.get(activeIdStr)!;

    const overData = over.data.current;
    
    let targetOfficeId: string | null = null;
    
    if (overData?.type === 'Office') {
      targetOfficeId = overIdStr;
    } else if (overData?.type === 'Employee') {
      const overEmployee = employeeMap.get(overIdStr);
      targetOfficeId = overEmployee?.officeId || null;
    } else if (officeMap.has(overIdStr)) {
      targetOfficeId = overIdStr;
    }


    if (!targetOfficeId || !officeMap.has(targetOfficeId)) {
        return;
    }
    
    if (activeEmployee.officeId !== targetOfficeId) {
        const updatedEmployee = { ...activeEmployee, officeId: targetOfficeId };
        
        onEmployeeUpdate(updatedEmployee); // Optimistic update
        
        try {
          await updateEmployee(active.id as string, { officeId: targetOfficeId, absenceEndDate: null });
        } catch (error) {
          onEmployeeUpdate(activeEmployee); // Revert optimistic update
          toast({
            title: "Error de Reasignación",
            description: `No se pudo mover a ${activeEmployee.name}.`,
            variant: "destructive",
          });
        }
    }
  }
  
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return employeeMap.get(activeId as string) || null;
  }, [activeId, employeeMap]);


  const handleOpenEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedEmployee: Employee) => {
    onEmployeeUpdate(updatedEmployee);
    setIsEditModalOpen(false);
  }

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 items-start">
        {offices.map(office => (
            <DroppableOffice 
              key={office.id} 
              office={office}
              employeeCount={(employeesByOffice[office.id] || []).length}
            >
                <SortableContext
                    items={(employeesByOffice[office.id] || []).map(e => e.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1">
                        {(employeesByOffice[office.id] || []).map(employee => (
                            <DraggableEmployee 
                              key={employee.id} 
                              employee={employee} 
                              onNameClick={() => handleOpenEditModal(employee)}
                            />
                        ))}
                    </div>
                </SortableContext>
                {(employeesByOffice[office.id] || []).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                        Sin personal
                    </div>
                )}
          </DroppableOffice>
        ))}
      </div>
      <DragOverlay>
        {activeItem ? <DraggableEmployee employee={activeItem as Employee} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
    {selectedEmployee && (
        <EditEmployeeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            employee={selectedEmployee}
            offices={offices}
        />
    )}
    </>
  );
}
