
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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';


const STATUSES: AttendanceStatus[] = ['Atrasado', 'Presente', 'Ausente'];

function StatusColumn({
  status,
  employees,
  onEdit,
  officeName,
  offices,
  officeId,
  activeId,
}: {
  status: AttendanceStatus,
  employees: Employee[],
  onEdit: (employee: Employee) => void,
  officeName?: string,
  offices: Office[],
  officeId: string;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

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
    <div 
      ref={setNodeRef} 
      className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors duration-300 ${config.bgColor} ${isOver ? 'border-2 border-dashed' : ''} ${config.borderColor}`}
    >
      <h2 className={`text-lg font-bold pb-2 mb-4 border-b-2 ${config.borderColor} ${config.textColor}`}>
        {title} ({employees.length})
      </h2>
      <SortableContext items={employees.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {employees.map((employee) => (
             <EmployeeCard 
                key={employee.id} 
                employee={employee} 
                onEdit={onEdit} 
                offices={offices}
                isDragging={activeId === employee.id}
             />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// Function to generate a static ID, preventing hydration errors with dnd-kit
let idCounter = 0;
function useStaticId() {
  const [id, setId] = useState('');
  useEffect(() => {
    // This runs only on the client, ensuring consistency
    idCounter += 1;
    setId(`dnd-context-${idCounter}`);
  }, []);
  return id;
}

export default function DashboardClient({ initialEmployees, offices, officeName, officeId }: { initialEmployees: Employee[], offices: Office[], officeName: string, officeId: string }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddOfficeModalOpen, setAddOfficeModalOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const staticId = useStaticId();
 
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
        if(statusMap[employee.status]) {
           statusMap[employee.status].push(employee);
        }
    }
    return statusMap;
  }, [employees]);


  const activeEmployee = useMemo(() => employees.find(e => e.id === activeId), [activeId, employees]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };


  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over || !active) {
        return;
    }

    const activeEmployee = employees.find(e => e.id === active.id);
    if (!activeEmployee) return;

    // Find the new status (from the column) and the target employee (if dropped on a card)
    const overId = over.id as string;
    const overIsColumn = STATUSES.includes(overId as any);
    const overEmployee = !overIsColumn ? employees.find(e => e.id === overId) : undefined;
    
    const newStatus: AttendanceStatus = overIsColumn ? overId as AttendanceStatus : overEmployee!.status;

    // If status hasn't changed and it's not a reorder, do nothing
    if (activeEmployee.status === newStatus && active.id === over.id) {
        return;
    }

    // Persist the change to the database first
    try {
        await updateEmployee(active.id as string, { status: newStatus });
    } catch (error) {
        console.error("Failed to update employee:", error);
        toast({
            title: "Error",
            description: "No se pudo actualizar el empleado.",
            variant: "destructive",
        });
        return; // Stop if the DB update fails
    }

    // Update the UI state optimistically
    setEmployees(currentEmployees => {
        const employeeToMove = { ...activeEmployee, status: newStatus };
        
        // Remove the employee from its old position
        const newEmployeeList = currentEmployees.filter(e => e.id !== active.id);

        // Find the index to insert the employee
        let newIndex: number;

        if (overEmployee) {
            // Dropped on another employee card
            newIndex = newEmployeeList.findIndex(e => e.id === overEmployee.id);
            // Insert before the target employee
            if (newIndex === -1) { // Should not happen, but as a fallback
              newIndex = newEmployeeList.length;
            }
        } else {
            // Dropped on a column, find the last index of an employee with the new status
            const lastEmployeeInNewStatus = [...newEmployeeList].reverse().find(e => e.status === newStatus);
            if (lastEmployeeInNewStatus) {
                newIndex = newEmployeeList.findIndex(e => e.id === lastEmployeeInNewStatus.id) + 1;
            } else {
                 // If the column is empty, find the start of the next status group or end
                const firstEmployeeOfNextStatus = newEmployeeList.find(e => STATUSES.indexOf(e.status) > STATUSES.indexOf(newStatus));
                if(firstEmployeeOfNextStatus) {
                    newIndex = newEmployeeList.findIndex(e => e.id === firstEmployeeOfNextStatus.id);
                } else {
                    newIndex = newEmployeeList.length;
                }
            }
        }
        
        // Insert the employee at the new position
        newEmployeeList.splice(newIndex, 0, employeeToMove);

        return newEmployeeList;
    });

    toast({
        title: "¡Éxito!",
        description: `Se movió a ${activeEmployee.name} a ${newStatus}.`,
    });
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
      id={staticId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
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
              officeId={officeId}
              activeId={activeId}
            />
          ))}
        </div>
      </div>

       <DragOverlay>
        {activeEmployee ? <EmployeeCard employee={activeEmployee} onEdit={handleOpenEditModal} offices={offices} isDragging={true} /> : null}
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
