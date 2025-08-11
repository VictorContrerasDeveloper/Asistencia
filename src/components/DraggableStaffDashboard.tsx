
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
const ADMIN_CONTAINER_ID = 'admin-staff-container';

type GroupedEmployees = {
  active: Employee[];
  prolongedAbsence: Employee[];
  dailyAbsence: Employee[];
}

export default function DraggableStaffDashboard({ 
  offices: initialOffices, 
  employees: initialEmployees, 
  onEmployeeUpdate,
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

  const { employeesByOffice, administrativeEmployees } = useMemo(() => {
    const groupedByOffice: Record<string, GroupedEmployees> = {};
    const adminEmployees: GroupedEmployees = { active: [], prolongedAbsence: [], dailyAbsence: [] };
    
    offices.forEach(office => {
        groupedByOffice[office.id] = { active: [], prolongedAbsence: [], dailyAbsence: [] };
    });

    employees.forEach(emp => {
      const targetGroup = emp.workMode === 'Administrativo' ? adminEmployees : groupedByOffice[emp.officeId];
      if (targetGroup) {
        if (emp.absenceReason === 'Inasistencia') {
          targetGroup.dailyAbsence.push(emp);
        } else if (PROLONGED_ABSENCE_REASONS.includes(emp.absenceReason)) {
          targetGroup.prolongedAbsence.push(emp);
        } else {
          targetGroup.active.push(emp);
        }
      }
    });

    const sorter = (a: Employee, b: Employee) => {
        const roleA = ROLE_ORDER[a.role] || 99;
        const roleB = ROLE_ORDER[b.role] || 99;
        if(roleA !== roleB) return roleA - roleB;
        
        const levelA = LEVEL_ORDER[a.level || 'Nivel Básico'] || 99;
        const levelB = LEVEL_ORDER[b.level || 'Nivel Básico'] || 99;
        if (levelA !== levelB) return levelA - levelB;

        return a.name.localeCompare(b.name);
    };

    for (const officeId in groupedByOffice) {
        groupedByOffice[officeId].active.sort(sorter);
        groupedByOffice[officeId].dailyAbsence.sort(sorter);
        groupedByOffice[officeId].prolongedAbsence.sort(sorter);
    }
    
    adminEmployees.active.sort(sorter);
    adminEmployees.dailyAbsence.sort(sorter);
    adminEmployees.prolongedAbsence.sort(sorter);
    
    return { employeesByOffice: groupedByOffice, administrativeEmployees: adminEmployees };
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
    let targetWorkMode = activeEmployee.workMode;

    //Dropped over admin container
    if (overIdStr === ADMIN_CONTAINER_ID) {
        targetWorkMode = 'Administrativo';
    } else {
        // Dropped over an office or an employee in an office
        targetWorkMode = 'Operaciones';
        if (overData?.type === 'Office') {
            targetOfficeId = overIdStr;
        } else if (overData?.type === 'Employee') {
            const overEmployee = employeeMap.get(overIdStr);
            targetOfficeId = overEmployee?.officeId || null;
        } else if (officeMap.has(overIdStr)) {
            targetOfficeId = overIdStr;
        }
    }

    const hasChanged = activeEmployee.workMode !== targetWorkMode || (targetWorkMode === 'Operaciones' && activeEmployee.officeId !== targetOfficeId);

    if (hasChanged) {
        if(targetWorkMode === 'Operaciones' && !targetOfficeId) return;

        const updates: Partial<Employee> = { workMode: targetWorkMode };
        if (targetWorkMode === 'Operaciones') {
            updates.officeId = targetOfficeId!;
        }

        const updatedEmployee = { ...activeEmployee, ...updates };
        onEmployeeUpdate(updatedEmployee);

        setUpdatingEmployeeId(active.id as string);
    
        try {
            await updateEmployee(active.id as string, updates);
        } catch (error) {
            // Revert on failure
            onEmployeeUpdate(activeEmployee);
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
    return [
        ...groups.active.map(e => e.id), 
        ...groups.dailyAbsence.map(e => e.id),
        ...groups.prolongedAbsence.map(e => e.id)
    ];
  }

  const allAdministrativeEmployeeIds = (): string[] => {
    return [
      ...administrativeEmployees.active.map(e => e.id),
      ...administrativeEmployees.dailyAbsence.map(e => e.id),
      ...administrativeEmployees.prolongedAbsence.map(e => e.id)
    ]
  }
  
  const sortedOffices = useMemo(() => {
    return [...offices].sort((a,b) => a.name.localeCompare(b.name))
  }, [offices]);

  const renderEmployeeGroup = (employees: Employee[], title: string | null) => (
    <>
      {title && (
        <>
          <Separator className="my-2" />
          <div className="text-xs font-semibold text-muted-foreground px-1 mb-1">
            {title}
          </div>
        </>
      )}
      {employees.map(employee => (
        <DraggableEmployee 
          key={employee.id} 
          employee={employee} 
          onNameClick={() => handleOpenEditModal(employee)}
          isUpdating={employee.id === updatingEmployeeId}
        />
      ))}
    </>
  );

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
            <DroppableOffice 
                office={{id: ADMIN_CONTAINER_ID, name: "Personal Administrativo"}}
                employeeCount={allAdministrativeEmployeeIds().length}
            >
                <SortableContext items={allAdministrativeEmployeeIds()} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                        {administrativeEmployees.active.length > 0 && renderEmployeeGroup(administrativeEmployees.active, null)}
                        {administrativeEmployees.dailyAbsence.length > 0 && renderEmployeeGroup(administrativeEmployees.dailyAbsence, 'Ausencia del Día')}
                        {administrativeEmployees.prolongedAbsence.length > 0 && renderEmployeeGroup(administrativeEmployees.prolongedAbsence, 'Ausencias Prolongadas')}
                    </div>
                </SortableContext>
                {allAdministrativeEmployeeIds().length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                      Sin personal
                  </div>
                )}
            </DroppableOffice>
          
          {sortedOffices.map(office => {
              const { active: activeEmployees, prolongedAbsence: prolongedAbsenceEmployees, dailyAbsence: dailyAbsenceEmployees } = employeesByOffice[office.id] || { active: [], prolongedAbsence: [], dailyAbsence: [] };
              const totalEmployees = activeEmployees.length + prolongedAbsenceEmployees.length + dailyAbsenceEmployees.length;

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
                          {activeEmployees.length > 0 && renderEmployeeGroup(activeEmployees, null)}
                          {dailyAbsenceEmployees.length > 0 && renderEmployeeGroup(dailyAbsenceEmployees, 'Ausencia del Día')}
                          {prolongedAbsenceEmployees.length > 0 && renderEmployeeGroup(prolongedAbsenceEmployees, 'Ausencias Prolongadas')}
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
