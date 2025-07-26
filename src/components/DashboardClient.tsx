
"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, updateEmployee, addOffice as apiAddOffice } from '@/lib/data';
import Link from 'next/link';
import EmployeeCard from './EmployeeCard';
import EditOfficeModal from './EditOfficeModal';
import AddOfficeModal from './AddOfficeModal';
import { DndContext, type DragEndEvent, useDroppable, type DragOverEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { Button } from './ui/button';
import { PlusCircle, Users, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

const STATUSES: AttendanceStatus[] = ['Atrasado', 'Presente', 'Ausente'];

function StatusColumn({ 
  status, 
  employees, 
  onEdit, 
  officeName,
  offices,
  activeId,
  draggedOverItemId,
  officeId
}: { 
  status: AttendanceStatus, 
  employees: Employee[], 
  onEdit: (employee: Employee) => void, 
  officeName?: string,
  offices: Office[],
  activeId: string | null,
  draggedOverItemId: string | null,
  officeId: string
}) {
  const { setNodeRef } = useDroppable({ id: status });

  const statusConfig = {
    Presente: {
      title: 'Presente',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
    },
    Atrasado: {
      title: 'Atrasado',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    Ausente: {
      title: 'Ausente',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
    },
  };
  
  const config = statusConfig[status];
  const title = officeId === 'general' ? config.title : (status === 'Presente' ? `Presentes en ${officeName}` : config.title);

  return (
    <div ref={setNodeRef} className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors duration-300 ${config.bgColor}`}>
      <h2 className={`text-lg font-bold pb-2 mb-4 border-b-2 ${config.borderColor} ${config.textColor}`}>
        {title} ({employees.length})
      </h2>
       <SortableContext items={employees.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
            {employees.map((employee) => {
               const isBeingDragged = activeId === employee.id;
              
              if (isBeingDragged) {
                 return <div key={`${employee.id}-placeholder`} className="bg-white/50 rounded-lg h-[76px]"></div>
              }
              
              return (
                 <EmployeeCard key={employee.id} employee={employee} onEdit={onEdit} offices={offices} />
              )
            })}
        </div>
      </SortableContext>
    </div>
  )
}

export default function DashboardClient({ initialEmployees, offices, officeName, officeId }: { initialEmployees: Employee[], offices: Office[], officeName: string, officeId: string }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddOfficeModalOpen, setAddOfficeModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedOverItemId, setDraggedOverItemId] = useState<string | null>(null);
 
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const employeesByStatus = useMemo(() => {
    const statusMap: Record<AttendanceStatus, Employee[]> = { Presente: [], Atrasado: [], Ausente: [] };
    for (const employee of employees) {
        statusMap[employee.status].push(employee);
    }
    return statusMap;
  }, [employees]);

  const activeEmployee = useMemo(() => employees.find(e => e.id === activeId), [activeId, employees]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const isActiveAnEmployee = active.data.current?.type === 'Employee';
    if (!isActiveAnEmployee) return;
  
    // Drop over a column
    const isOverAColumn = STATUSES.includes(overId as AttendanceStatus);
    if (isOverAColumn) {
      const activeEmployee = employees.find(e => e.id === activeId);
      if (activeEmployee && activeEmployee.status !== overId) {
        setEmployees(employees => {
          activeEmployee.status = overId as AttendanceStatus;
          return [...employees];
        });
      }
    }
  
    // Drop over another employee
    const isOverAnEmployee = over.data.current?.type === 'Employee';
    if (isOverAnEmployee && activeId !== overId) {
      const activeIndex = employees.findIndex(e => e.id === activeId);
      const overIndex = employees.findIndex(e => e.id === overId);
      const activeEmployee = employees[activeIndex];
      const overEmployee = employees[overIndex];
  
      if (activeEmployee.status !== overEmployee.status) {
        activeEmployee.status = overEmployee.status;
        const newIndex = activeIndex > overIndex ? overIndex : overIndex;
        setEmployees(employees => arrayMove(employees, activeIndex, newIndex));
      } else {
        setEmployees(employees => arrayMove(employees, activeIndex, overIndex));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
  
    if (!over) return;
  
    const employeeId = active.id as string;
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
  
    let finalStatus: AttendanceStatus;
    let newEmployees = [...employees];
    const activeIndex = newEmployees.findIndex(e => e.id === activeId);
  
    // Determine the final status and position
    if (STATUSES.includes(over.id as AttendanceStatus)) {
      // Dropped on a column
      finalStatus = over.id as AttendanceStatus;
      if (employee.status !== finalStatus) {
        newEmployees[activeIndex].status = finalStatus;
        // Move to the end of the new status group
        const lastIndexOfStatus = newEmployees.map(e => e.status).lastIndexOf(finalStatus);
        newEmployees = arrayMove(newEmployees, activeIndex, lastIndexOfStatus >= 0 ? lastIndexOfStatus : newEmployees.length -1 );
      }
    } else if (over.data.current?.type === 'Employee' && active.id !== over.id) {
      // Dropped on another employee
      const overIndex = newEmployees.findIndex(e => e.id === over.id);
      const overEmployee = newEmployees[overIndex];
      finalStatus = overEmployee.status;
      
      newEmployees[activeIndex].status = finalStatus;
      newEmployees = arrayMove(newEmployees, activeIndex, overIndex);
    } else {
      // No valid drop, do nothing
      return;
    }
  
    setEmployees(newEmployees);
    updateEmployee(employeeId, { status: finalStatus });
  };

  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
  };
  
  const handleCloseModal = () => {
    setEditingEmployee(null);
  };
  
  const handleSaveOffice = async (employeeId: string, newOfficeId: string) => {
    await updateEmployee(employeeId, { officeId: newOfficeId });
    
    if (officeId !== 'general') {
       setEmployees(prev => prev.filter(e => e.id !== employeeId));
    } else {
       setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, officeId: newOfficeId } : e));
    }
    handleCloseModal();
  };

  const handleAddOffice = async (name: string) => {
    if (!name) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el nombre de la oficina.",
        variant: "destructive",
      });
      return;
    }
    await apiAddOffice(name);
    toast({
        title: "¡Éxito!",
        description: "La oficina ha sido agregada correctamente.",
    });
    setAddOfficeModalOpen(false);
    router.refresh();
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd} 
      onDragCancel={() => {
        setActiveId(null);
        setDraggedOverItemId(null);
      }}
    >
      <div className="p-4 md:p-8 space-y-8">
        {officeId === 'general' && (
             <div className="flex flex-wrap justify-center gap-4">
                 <Button onClick={() => setAddOfficeModalOpen(true)}>
                    <PlusCircle />
                    Agregar Oficina
                </Button>
                <Link href="/dashboard/add-employee">
                  <Button>
                      <PlusCircle />
                      Agregar Ejecutivo
                  </Button>
                </Link>
                <Link href="/dashboard/bulk-add-employees">
                    <Button>
                        <Users />
                        Carga Masiva
                    </Button>
                </Link>
                <Link href="/dashboard/delete-employee">
                    <Button variant="destructive">
                        <Trash2 />
                        Eliminar Ejecutivo(s)
                    </Button>
                </Link>
            </div>
        )}
        <div className="flex flex-col md:flex-row gap-6">
          {STATUSES.map(status => (
            <StatusColumn
              key={status}
              status={status}
              employees={employeesByStatus[status]}
              onEdit={handleOpenEditModal}
              officeName={officeName}
              offices={offices}
              activeId={activeId}
              draggedOverItemId={draggedOverItemId}
              officeId={officeId}
            />
          ))}
        </div>
      </div>

       <DragOverlay>
        {activeEmployee ? <EmployeeCard employee={activeEmployee} onEdit={handleOpenEditModal} offices={offices} /> : null}
      </DragOverlay>

      {editingEmployee && (
        <EditOfficeModal
          employee={editingEmployee}
          offices={offices}
          isOpen={!!editingEmployee}
          onClose={handleCloseModal}
          onSave={handleSaveOffice}
        />
      )}
      <AddOfficeModal
        isOpen={isAddOfficeModalOpen}
        onClose={() => setAddOfficeModalOpen(false)}
        onSave={handleAddOffice}
      />
    </DndContext>
  );
}
