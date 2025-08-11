
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
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { Office, Employee, EmployeeRole, EmployeeLevel, updateEmployee, AbsenceReason, updateOfficeOrder } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import DroppableOffice from './DroppableOffice';
import DraggableEmployee from './DraggableEmployee';
import EditEmployeeModal from './EditEmployeeModal';
import { TooltipProvider } from './ui/tooltip';
import { Separator } from './ui/separator';
import { CSS } from '@dnd-kit/utilities';

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

const SortableOfficeItem = ({ office, children }: { office: Office, children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: office.id,
        data: { type: 'Office', office }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 200 : 'auto'
    };

    return (
        <div ref={setNodeRef} style={style}>
            <DroppableOffice
                office={office}
                employeeCount={office.employees.length}
                dragHandleProps={{...attributes, ...listeners}}
            >
                {children}
            </DroppableOffice>
        </div>
    );
};


export default function DraggableStaffDashboard({ 
  offices: initialOffices, 
  employees: initialEmployees, 
  onEmployeeUpdate,
}: DraggableStaffDashboardProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [offices, setOffices] = useState(initialOffices);
  const [activeItem, setActiveItem] = useState<Employee | Office | null>(null);
  const [activeType, setActiveType] = useState<'Employee' | 'Office' | null>(null);

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
    const groupedByOffice: Record<string, GroupedEmployees & { officeData: Office }> = {};
    const adminEmployees: GroupedEmployees = { active: [], prolongedAbsence: [], dailyAbsence: [] };
    
    offices.forEach(office => {
        groupedByOffice[office.id] = { officeData: office, active: [], prolongedAbsence: [], dailyAbsence: [] };
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
    const { active } = event;
    const type = active.data.current?.type;
    setActiveType(type);

    if (type === 'Employee') {
        setActiveItem(employeeMap.get(active.id as string) || null);
    } else if (type === 'Office') {
        setActiveItem(officeMap.get(active.id as string) || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
  
    if (!over) {
        setActiveItem(null);
        setActiveType(null);
        return;
    };
    
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    const type = active.data.current?.type;

    if (type === 'Employee') {
        await handleEmployeeDragEnd(activeIdStr, overIdStr, over.data.current);
    } else if (type === 'Office') {
        await handleOfficeDragEnd(activeIdStr, overIdStr);
    }
    setActiveItem(null);
    setActiveType(null);
  }

  const handleOfficeDragEnd = async (activeId: string, overId: string) => {
    if (activeId !== overId) {
        const oldIndex = offices.findIndex(o => o.id === activeId);
        const newIndex = offices.findIndex(o => o.id === overId);
        
        const newOrder = arrayMove(offices, oldIndex, newIndex);
        setOffices(newOrder);

        const orderUpdates = newOrder.map((office, index) => ({
            id: office.id,
            order: index
        }));

        try {
            await updateOfficeOrder(orderUpdates);
        } catch(error) {
            setOffices(offices); // revert on failure
            toast({
                title: "Error al Reordenar",
                description: "No se pudo guardar el nuevo orden de las oficinas.",
                variant: "destructive"
            });
        }
    }
  }

  const handleEmployeeDragEnd = async (activeId: string, overId: string, overData: any) => {
    const activeEmployee = employeeMap.get(activeId)!;
    
    let targetOfficeId: string | null = null;
    let targetWorkMode = activeEmployee.workMode;

    if (overId === ADMIN_CONTAINER_ID || overData?.type === 'AdminContainer') {
        targetWorkMode = 'Administrativo';
    } else {
        targetWorkMode = 'Operaciones';
        if (overData?.type === 'Office') {
            targetOfficeId = overId;
        } else if (overData?.type === 'Employee') {
            const overEmployee = employeeMap.get(overId);
            targetOfficeId = overEmployee?.officeId || null;
        } else if (officeMap.has(overId)) {
            targetOfficeId = overId;
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

        setUpdatingEmployeeId(activeId);
    
        try {
            await updateEmployee(activeId, updates);
        } catch (error) {
            onEmployeeUpdate(activeEmployee); // Revert
            toast({
            title: "Error de Reasignación",
            description: `No se pudo mover a ${activeEmployee.name}.`,
            variant: "destructive",
            });
        } finally {
            setUpdatingEmployeeId(null);
        }
    }
  }

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

  const adminEmployeesCount = allAdministrativeEmployeeIds().length;

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
            <SortableContext items={offices.map(o => o.id)}>
              {offices.map(office => {
                  const { active: activeEmployees, prolongedAbsence: prolongedAbsenceEmployees, dailyAbsence: dailyAbsenceEmployees } = employeesByOffice[office.id] || { officeData: office, active: [], prolongedAbsence: [], dailyAbsence: [] };
                  const totalEmployees = activeEmployees.length + prolongedAbsenceEmployees.length + dailyAbsenceEmployees.length;

                  return (
                  <SortableOfficeItem key={office.id} office={{...office, employees: []}}>
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
                  </SortableOfficeItem>
              )})}
            </SortableContext>
             <DroppableOffice
                office={{id: ADMIN_CONTAINER_ID, name: "Personal Administrativo"}}
                employeeCount={adminEmployeesCount}
                dragHandleProps={{style: { display: 'none' }}}
            >
                <SortableContext items={allAdministrativeEmployeeIds()} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                        {administrativeEmployees.active.length > 0 && renderEmployeeGroup(administrativeEmployees.active, null)}
                        {administrativeEmployees.dailyAbsence.length > 0 && renderEmployeeGroup(administrativeEmployees.dailyAbsence, 'Ausencia del Día')}
                        {administrativeEmployees.prolongedAbsence.length > 0 && renderEmployeeGroup(administrativeEmployees.prolongedAbsence, 'Ausencias Prolongadas')}
                    </div>
                </SortableContext>
                {adminEmployeesCount === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                      Sin personal
                  </div>
                )}
            </DroppableOffice>
        </div>
      </TooltipProvider>
      <DragOverlay>
        {activeItem ? (
            activeType === 'Employee' ? <DraggableEmployee employee={activeItem as Employee} isOverlay /> :
            activeType === 'Office' ? <DroppableOffice office={activeItem as Office} isOverlay employeeCount={(activeItem as Office).employees?.length || 0} /> : null
        ) : null}
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
