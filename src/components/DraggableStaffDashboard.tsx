
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
import { Office, Employee, EmployeeRole, EmployeeLevel, updateEmployee, AbsenceReason } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import DroppableOffice from './DroppableOffice';
import DraggableEmployee from './DraggableEmployee';
import EditEmployeeModal from './EditEmployeeModal';
import { TooltipProvider } from './ui/tooltip';
import { Separator } from './ui/separator';


type DraggableStaffDashboardProps = {
  offices: Office[];
  employees: Employee[];
  onEmployeeUpdate: (employee: Employee) => void;
  onRefreshData: () => Promise<void>;
};

const ROLE_ORDER: Record<EmployeeRole, number> = {
    'Supervisión': 1,
    'Modulo': 2,
    'Tablet': 3,
    'Anfitrión': 4,
};

const LEVEL_ORDER: Record<EmployeeLevel, number> = {
    'Nivel 2': 1,
    'Nivel intermedio': 2,
    'Nivel 1': 3,
    'Nivel Básico': 4,
};

const PROLONGED_ABSENCE_REASONS: AbsenceReason[] = ['Licencia médica', 'Vacaciones', 'Otro'];

type GroupedEmployees = {
  active: Employee[];
  prolongedAbsence: Employee[];
}

export default function DraggableStaffDashboard({ 
  offices: initialOffices, 
  employees: initialEmployees, 
  onEmployeeUpdate,
  onRefreshData,
}: DraggableStaffDashboardProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [offices, setOffices] = useState(initialOffices);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);

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
    const groupedByOffice: Record<string, { active: Employee[], prolongedAbsence: Employee[] }> = {};
    
    // Initialize with empty arrays for all offices
    offices.forEach(office => {
        groupedByOffice[office.id] = { active: [], prolongedAbsence: [] };
    });

    // Group employees
    employees.forEach(emp => {
      const officeGroup = groupedByOffice[emp.officeId];
      if (officeGroup) {
        if (emp.status === 'Ausente' && PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason)) {
          officeGroup.prolongedAbsence.push(emp);
        } else {
          officeGroup.active.push(emp);
        }
      }
    });

    // Sort employees within each group
    for (const officeId in groupedByOffice) {
        const sorter = (a: Employee, b: Employee) => {
            const roleA = ROLE_ORDER[a.role] || 99;
            const roleB = ROLE_ORDER[b.role] || 99;
            if(roleA !== roleB) return roleA - roleB;
            
            const levelA = LEVEL_ORDER[a.level || 'Nivel Básico'] || 99;
            const levelB = LEVEL_ORDER[b.level || 'Nivel Básico'] || 99;
            if (levelA !== levelB) return levelA - levelB;

            return a.name.localeCompare(b.name);
        };
        groupedByOffice[officeId].active.sort(sorter);
        groupedByOffice[officeId].prolongedAbsence.sort(sorter);
    }
    
    return groupedByOffice;
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
      const originalEmployees = [...employees];
      
      const updatedEmployees = employees.map(emp => 
        emp.id === active.id ? { ...emp, officeId: targetOfficeId! } : emp
      );
      setEmployees(updatedEmployees);
      setUpdatingEmployeeId(active.id as string);
  
      try {
        await updateEmployee(active.id as string, { officeId: targetOfficeId });
        // No need to call onRefreshData if we are manually updating state
      } catch (error) {
        setEmployees(originalEmployees);
        toast({
          title: "Error de Reasignación",
          description: `No se pudo mover a ${activeEmployee.name}. Se revirtió el cambio.`,
          variant: "destructive",
        });
      } finally {
        setUpdatingEmployeeId(null);
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

  const allEmployeeIdsInOffice = (officeId: string): string[] => {
    const groups = employeesByOffice[officeId];
    if (!groups) return [];
    return [...groups.active.map(e => e.id), ...groups.prolongedAbsence.map(e => e.id)];
  }

  return (
    <>
    <DndContext
      id="staff-dashboard-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <TooltipProvider>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 items-start">
          {offices.map(office => {
              const { active: activeEmployees, prolongedAbsence: prolongedAbsenceEmployees } = employeesByOffice[office.id] || { active: [], prolongedAbsence: [] };
              const totalEmployees = activeEmployees.length + prolongedAbsenceEmployees.length;

              return (
              <DroppableOffice 
                key={office.id} 
                office={office}
                employeeCount={totalEmployees}
              >
                  <SortableContext
                      items={allEmployeeIdsInOffice(office.id)}
                      strategy={verticalListSortingStrategy}
                  >
                      <div className="space-y-1">
                          {activeEmployees.map(employee => (
                              <DraggableEmployee 
                                key={employee.id} 
                                employee={employee} 
                                onNameClick={() => handleOpenEditModal(employee)}
                                isUpdating={employee.id === updatingEmployeeId}
                              />
                          ))}
                          {prolongedAbsenceEmployees.length > 0 && activeEmployees.length > 0 && (
                            <Separator className="my-2" />
                          )}
                           {prolongedAbsenceEmployees.map(employee => (
                              <DraggableEmployee 
                                key={employee.id} 
                                employee={employee} 
                                onNameClick={() => handleOpenEditModal(employee)}
                                isUpdating={employee.id === updatingEmployeeId}
                              />
                          ))}
                      </div>
                  </SortableContext>
                  {totalEmployees === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                          Sin personal
                      </div>
                  )}
            </DroppableOffice>
          )})}
        </div>
      </TooltipProvider>
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
