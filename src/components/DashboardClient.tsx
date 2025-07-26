
"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, updateEmployee, addOffice as apiAddOffice, getOfficeById } from '@/lib/data';
import Link from 'next/link';
import EmployeeCard from './EmployeeCard';
import EditOfficeModal from './EditOfficeModal';
import AddOfficeModal from './AddOfficeModal';
import { DndContext, type DragEndEvent, useDroppable, type DragOverEvent, useSensor, useSensors, PointerSensor, DragOverlay, closestCenter } from '@dnd-kit/core';
import { Button } from './ui/button';
import { PlusCircle, Users, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';


const STATUSES: AttendanceStatus[] = ['Atrasado', 'Presente', 'Ausente'];

function StatusColumn({
  status,
  employees,
  onEdit,
  officeName,
  offices,
  activeId,
  officeId,
  insertionId,
  insertionStatus,
}: {
  status: AttendanceStatus,
  employees: Employee[],
  onEdit: (employee: Employee) => void,
  officeName?: string,
  offices: Office[],
  activeId: string | null,
  officeId: string,
  insertionId: string | null,
  insertionStatus: AttendanceStatus | null,
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
                  return <div key={`${employee.id}-placeholder`} className="bg-card/50 rounded-lg h-[76px] border-2 border-dashed border-primary"></div>
               }
              return (
                 <EmployeeCard 
                    key={employee.id} 
                    employee={employee} 
                    onEdit={onEdit} 
                    offices={offices} 
                    isInsertionTarget={insertionId === employee.id && insertionStatus === status}
                 />
              )
            })}
             {insertionId === null && insertionStatus === status && (
                <div key="insertion-point-end" className="bg-card/50 rounded-lg h-[76px] border-2 border-dashed border-primary"></div>
             )}
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
  const [insertionId, setInsertionId] = useState<string | null>(null);
  const [insertionStatus, setInsertionStatus] = useState<AttendanceStatus | null>(null);
 
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
    const tempEmployees = [...employees];
    if (activeId) {
        // Exclude active employee from the list to prevent it from being rendered twice
        const activeIndex = tempEmployees.findIndex(e => e.id === activeId);
        if (activeIndex > -1) {
            tempEmployees.splice(activeIndex, 1);
        }
    }
    for (const employee of tempEmployees) {
        statusMap[employee.status].push(employee);
    }
    return statusMap;
  }, [employees, activeId]);


  const activeEmployee = useMemo(() => employees.find(e => e.id === activeId), [activeId, employees]);

 const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
        setInsertionId(null);
        setInsertionStatus(null);
        return;
    };
  
    const overId = over.id as string;
    const overIsColumn = STATUSES.includes(overId as AttendanceStatus);
  
    if (overIsColumn) {
        setInsertionStatus(overId as AttendanceStatus);
        const employeesInStatus = employeesByStatus[overId as AttendanceStatus];
        if (employeesInStatus.length > 0) {
            // Default to inserting at the end if the column is not empty but no specific card is hovered.
             setInsertionId(null); 
        } else {
             setInsertionId(null); // empty column
        }
    } else {
        const overEmployee = employees.find(e => e.id === overId);
        if (overEmployee) {
            setInsertionStatus(overEmployee.status);
            
            const overNode = over.rect;
            const pointerY = event.activatorEvent.clientY;
            const isAfter = pointerY > overNode.top + overNode.height / 2;
            
            if(isAfter) {
                setInsertionId(null); // insert after
            } else {
                 setInsertionId(overId); // insert before
            }
        }
    }
};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setInsertionId(null);
    setInsertionStatus(null);
  
    if (!over) return;
  
    const employeeId = active.id as string;
    const oldEmployee = employees.find(e => e.id === employeeId);
    if (!oldEmployee) return;
  
    let newStatus: AttendanceStatus;
    let newIndex: number;
    let newEmployees = [...employees];
    
    const overId = over.id as string;
    const overIsColumn = STATUSES.includes(overId as AttendanceStatus);
  
    if (overIsColumn) {
      newStatus = overId as AttendanceStatus;
    } else {
      const overEmployee = employees.find(e => e.id === overId);
      if (!overEmployee) return;
      newStatus = overEmployee.status;
    }
  
    const activeIndex = newEmployees.findIndex(e => e.id === employeeId);
    newEmployees[activeIndex] = { ...newEmployees[activeIndex], status: newStatus };
  
    const employeesInNewStatus = newEmployees.filter(e => e.status === newStatus && e.id !== employeeId);
  
    if (overIsColumn) {
        newIndex = newEmployees.length - 1; // move to the end
    } else {
        const overIndexInAll = newEmployees.findIndex(e => e.id === overId);
        
        const overNode = over.rect;
        const pointerY = (event.activatorEvent as MouseEvent).clientY;
        const isAfter = pointerY > overNode.top + overNode.height / 2;

        newIndex = isAfter ? overIndexInAll + 1 : overIndexInAll;
    }
  
    // Perform the move
    newEmployees = arrayMove(newEmployees, activeIndex, newIndex);
    
    setEmployees(newEmployees);
    updateEmployee(employeeId, { status: newStatus });
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setInsertionId(null);
        setInsertionStatus(null);
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
              officeId={officeId}
              insertionId={insertionId}
              insertionStatus={insertionStatus}
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
