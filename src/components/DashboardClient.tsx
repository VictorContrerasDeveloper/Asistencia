
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
  officeId,
}: {
  status: AttendanceStatus,
  employees: Employee[],
  onEdit: (employee: Employee) => void,
  officeName?: string,
  offices: Office[],
  officeId: string,
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
            {employees.map((employee) => (
               <EmployeeCard key={employee.id} employee={employee} onEdit={onEdit} offices={offices} />
            ))}
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
  
    if (!over) return;
  
    const activeEmployee = employees.find(e => e.id === active.id);
    if (!activeEmployee) return;
  
    // Determine the new status. It can be a column ID or the status of the employee we're dropping on.
    const overId = over.id;
    const overIsColumn = STATUSES.includes(overId as AttendanceStatus);
    const overEmployee = employees.find(e => e.id === overId);
  
    let newStatus: AttendanceStatus | undefined = undefined;
    if (overIsColumn) {
      newStatus = overId as AttendanceStatus;
    } else if (overEmployee) {
      newStatus = overEmployee.status;
    }
  
    if (!newStatus) return;
  
    // Update the employee in the database
    updateEmployee(active.id as string, { status: newStatus });
  
    setEmployees(currentEmployees => {
      const activeIndex = currentEmployees.findIndex(e => e.id === active.id);
      let newIndex: number;
  
      if (overEmployee) {
        // Dropped on another employee card
        newIndex = currentEmployees.findIndex(e => e.id === overId);
      } else {
        // Dropped on a column, find the last employee in that column
        const employeesInNewStatus = currentEmployees.filter(e => e.status === newStatus);
        if (employeesInNewStatus.length > 0) {
            // Place it at the end of the target column
            const lastEmployee = employeesInNewStatus[employeesInNewStatus.length - 1];
            newIndex = currentEmployees.findIndex(e => e.id === lastEmployee.id) + 1;
        } else {
            // If the column is empty, we can just append it to the end of the whole list for now.
            // The status update will handle the column assignment.
            newIndex = currentEmployees.length; 
        }
      }
      
      // Update the status of the dragged employee
      const updatedEmployee = { ...currentEmployees[activeIndex], status: newStatus };
      
      // Create a new array with the employee removed
      const tempEmployees = [...currentEmployees];
      tempEmployees.splice(activeIndex, 1);
  
      // Insert the employee in the new position
      tempEmployees.splice(newIndex, 0, updatedEmployee);
  
      return tempEmployees;
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
