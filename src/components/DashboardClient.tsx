
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
            {employees.map((employee, index) => {
               const isBeingDraggedOver = draggedOverItemId === employee.id;
               const isBeingDragged = activeId === employee.id;
               const card = <EmployeeCard key={employee.id} employee={employee} onEdit={onEdit} offices={offices} />;

               if (isBeingDragged) {
                 return <div key={`${employee.id}-placeholder`} className="opacity-50 ">{card}</div>
               }
              
              return (
                <div key={employee.id} style={{ transform: isBeingDraggedOver ? 'translateY(24px)' : 'translateY(0)', transition: 'transform 0.2s' }}>
                  {card}
                </div>
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
    const { over } = event;
    if (over && over.data.current?.type === 'Employee') {
      setDraggedOverItemId(over.id as string);
    } else {
      setDraggedOverItemId(null);
    }

    const { active } = event;
    if (!over || active.id === over.id) return;

    const activeEmployee = employees.find(e => e.id === active.id);
    
    // Logic to move between columns
    if (activeEmployee && (STATUSES.includes(over.id as AttendanceStatus))) {
      const newStatus = over.id as AttendanceStatus;
      if (activeEmployee.status !== newStatus) {
         setEmployees(prev => prev.map(e => e.id === active.id ? { ...e, status: newStatus } : e));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedOverItemId(null);

    if (!over) {
        return;
    }

    const employeeId = active.id as string;
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    let newStatus: AttendanceStatus | undefined = undefined;

    // Dropped on a column
    if (STATUSES.includes(over.id as AttendanceStatus)) {
        newStatus = over.id as AttendanceStatus;
    }
    // Dropped on another employee
    else {
        const overEmployee = employees.find(e => e.id === over.id);
        if (overEmployee) {
            newStatus = overEmployee.status;
        }
    }

    if(newStatus && employee.status !== newStatus) {
      updateEmployee(employeeId, { status: newStatus });
       setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, status: newStatus as AttendanceStatus } : e));
    }
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
