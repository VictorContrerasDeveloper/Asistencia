
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
  arrayMove,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Office, Employee, EmployeeRole, updateEmployee, updateOfficeOrder } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import DraggableOffice from './DraggableOffice';
import DraggableEmployee from './DraggableEmployee';
import EditEmployeeModal from './EditEmployeeModal';


type DraggableStaffDashboardProps = {
  offices: Office[];
  employees: Employee[];
  onEmployeeUpdate: (employee: Employee) => void;
  onOfficeOrderChange: (offices: Office[]) => void;
};

const ROLE_ORDER: Record<EmployeeRole, number> = {
    'Supervisión': 1,
    'Modulo': 2,
    'Tablet': 3,
    'Anfitrión': 4,
};

export default function DraggableStaffDashboard({ 
  offices: initialOffices, 
  employees: initialEmployees, 
  onEmployeeUpdate,
  onOfficeOrderChange,
}: DraggableStaffDashboardProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [offices, setOffices] = useState(initialOffices);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeItemType, setActiveItemType] = useState<'employee' | 'office' | null>(null);

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
    const type = event.active.data.current?.type;
    setActiveItemType(type === 'Office' ? 'office' : 'employee');
  };

  const handleEmployeeDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;
    
    const activeEmployee = employeeMap.get(active.id as string);
    if (!activeEmployee) return;

    const overId = over.id as string;
    const overData = over.data.current;
    
    let targetOfficeId: string | null = null;
    
    if (overData?.type === 'Office') {
      targetOfficeId = overId;
    } else if (overData?.type === 'Employee') {
      const overEmployee = employeeMap.get(overId);
      targetOfficeId = overEmployee?.officeId || null;
    }
    
    if (!targetOfficeId || !officeMap.has(targetOfficeId)) {
        return;
    }
    
    if (activeEmployee.officeId !== targetOfficeId) {
        const originalEmployees = [...employees];
        const updatedEmployee = { ...activeEmployee, officeId: targetOfficeId };
        
        const newEmployees = employees.map(e => e.id === active.id ? updatedEmployee : e);
        setEmployees(newEmployees);
        
        try {
          await updateEmployee(active.id as string, { officeId: targetOfficeId });
          onEmployeeUpdate(updatedEmployee);
        } catch (error) {
          setEmployees(originalEmployees);
          toast({
            title: "Error de Reasignación",
            description: `No se pudo mover a ${activeEmployee.name}.`,
            variant: "destructive",
          });
        }
    }
  }

  const handleOfficeDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = offices.findIndex(o => o.id === active.id);
    const newIndex = offices.findIndex(o => o.id === over.id);

    const newOffices = arrayMove(offices, oldIndex, newIndex);
    setOffices(newOffices);
    onOfficeOrderChange(newOffices);
    
    const officeOrder = newOffices.map((office, index) => ({ id: office.id, order: index }));
    try {
      await updateOfficeOrder(officeOrder);
    } catch (error) {
      setOffices(offices); // revert on error
      onOfficeOrderChange(offices);
      toast({
        title: "Error",
        description: "No se pudo guardar el nuevo orden de las oficinas.",
        variant: "destructive"
      });
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if(activeItemType === 'employee') {
      handleEmployeeDragEnd(event);
    } else if(activeItemType === 'office') {
      handleOfficeDragEnd(event);
    }
    setActiveId(null);
    setActiveItemType(null);
  }
  
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return activeItemType === 'office' ? officeMap.get(activeId as string) : employeeMap.get(activeId as string);
  }, [activeId, activeItemType, officeMap, employeeMap]);


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
      <SortableContext items={offices.map(o => o.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 items-start">
          {offices.map(office => (
             <DraggableOffice 
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
            </DraggableOffice>
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId && activeItem ? (
           activeItemType === 'employee' ? 
              <DraggableEmployee employee={activeItem as Employee} isOverlay /> :
              <DraggableOffice 
                  office={activeItem as Office} 
                  isOverlay 
                  employeeCount={(employeesByOffice[(activeItem as Office).id] || []).length}
              />
        ) : null}
      </DragOverlay>
    </DndContext>
    {selectedEmployee && (
        <EditEmployeeModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            employee={selectedEmployee}
        />
    )}
    </>
  );
}
