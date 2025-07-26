
"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, updateEmployee, getOfficeById, addOffice as apiAddOffice } from '@/lib/data';
import Link from 'next/link';
import EmployeeCard from './EmployeeCard';
import EditOfficeModal from './EditOfficeModal';
import AddOfficeModal from './AddOfficeModal';
import { DndContext, type DragEndEvent, useDroppable, type DragOverEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Button } from './ui/button';
import { PlusCircle, Users, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const STATUSES: AttendanceStatus[] = ['Atrasado', 'Presente', 'Ausente'];

function StatusColumn({ 
  status, 
  employees, 
  onEdit, 
  officeName, 
  activeId,
  overId 
}: { 
  status: AttendanceStatus, 
  employees: Employee[], 
  onEdit: (employee: Employee) => void, 
  officeName?: string, 
  activeId: string | null,
  overId: string | null 
}) {
  const { setNodeRef } = useDroppable({ id: status });

  const statusConfig = {
     Presente: {
      title: `Presentes en ${officeName}`,
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
    },
    Atrasado: {
      title: 'Pendientes / Atrasados',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    Ausente: {
      title: 'Ausentes',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div ref={setNodeRef} className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors duration-300 ${config.bgColor}`}>
      <h2 className={`text-lg font-bold pb-2 mb-4 border-b-2 ${config.borderColor} ${config.textColor}`}>
        {status === 'Presente' && officeName !== 'Panel General' ? `Presentes en ${officeName}` : config.title} ({employees.length})
      </h2>
      <div className="space-y-4">
        {employees.map((employee) => {
          const isOver = overId === employee.id && activeId !== employee.id;
          const transform = isOver ? 'translateY(110px)' : 'translateY(0)';
          
          const isDraggingDifferentStatus = activeId && employee.status !== status;
          const shouldAnimate = isOver && isDraggingDifferentStatus;
          
          // Don't render the placeholder for the item being dragged
          if (employee.id === activeId) return null;

          return (
            <div key={employee.id} style={{ transition: 'transform 0.25s ease-in-out', transform: shouldAnimate ? transform : 'translateY(0)' }}>
              <EmployeeCard employee={employee} onEdit={onEdit} />
            </div>
          );
        })}
        {/* Placeholder for the dragged item */}
        {activeId && overId && employees.find(e => e.id === overId) && employees.find(e=>e.id === overId)?.status === status &&
          <div style={{ transition: 'transform 0.25s ease-in-out', transform: 'translateY(0)' }}>
            {/* You might want a different looking placeholder */}
          </div>
        }

      </div>
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
  const [overId, setOverId] = useState<string | null>(null);

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
    
    // Logic to re-order based on drag operation for visual feedback
    if (activeId && overId && activeId !== overId) {
        const activeEmployee = employees.find(e => e.id === activeId);
        if (activeEmployee) {
            const overEmployee = employees.find(e => e.id === overId);
            const overStatus = overEmployee?.status;
            if(overStatus) {
                const activeStatus = activeEmployee.status;

                if (activeStatus !== overStatus) {
                    // Remove from old status column
                    statusMap[activeStatus] = statusMap[activeStatus].filter(e => e.id !== activeId);
                    // Add to new status column at correct position
                    const overIndex = statusMap[overStatus].findIndex(e => e.id === overId);
                    if (overIndex !== -1) {
                         statusMap[overStatus].splice(overIndex, 0, activeEmployee);
                    }
                }
            }
        }
    }

    return statusMap;
  }, [employees, activeId, overId]);


  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const isOverEmployeeCard = over.data?.current?.type === 'Employee';
      if(isOverEmployeeCard) {
        setOverId(over.id as string);
      } else {
         // It's a column
         const columnId = over.id as AttendanceStatus;
         const employeesInColumn = employees.filter(e => e.status === columnId);
         if (employeesInColumn.length === 0) {
            setOverId(columnId); // Target the column directly if empty
         } else {
            setOverId(null);
         }
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const employeeId = active.id as string;
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      let newStatus: AttendanceStatus;
      
      const overIsEmployee = over.data?.current?.type === 'Employee';

      if (overIsEmployee) {
        const overEmployee = employees.find(e => e.id === over.id);
        newStatus = overEmployee?.status as AttendanceStatus;
      } else {
        newStatus = over.id as AttendanceStatus;
      }
      
      if(employee.status !== newStatus && STATUSES.includes(newStatus)) {
        updateEmployee(employeeId, { status: newStatus });
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, status: newStatus } : e));
      }
    }
    setActiveId(null);
    setOverId(null);
  };


  const handleOpenEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
  };
  
  const handleCloseModal = () => {
    setEditingEmployee(null);
  };
  
  const handleSaveOffice = async (employeeId: string, newOfficeId: string) => {
    await updateEmployee(employeeId, { officeId: newOfficeId });
    
    setEmployees(async prev => {
      const newOffice = await getOfficeById(newOfficeId);
      if (officeName !== 'Panel General' && newOffice?.name !== officeName) {
        return prev.filter(e => e.id !== employeeId);
      }
      return prev.map(e => e.id === employeeId ? { ...e, officeId: newOfficeId } : e)
    });
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
      onDragCancel={() => { setActiveId(null); setOverId(null); }}
    >
      <div className="p-4 md:p-8 space-y-8">
        {officeId === 'general' && (
             <div className="flex flex-wrap justify-center gap-4">
                 <Button onClick={() => setAddOfficeModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Oficina
                </Button>
                <Link href="/dashboard/add-employee">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Ejecutivo
                </Button>
            </Link>
            <Link href="/dashboard/bulk-add-employees">
                <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Carga Masiva
                </Button>
            </Link>
            <Link href="/dashboard/delete-employee">
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
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
              activeId={activeId}
              overId={overId}
            />
          ))}
        </div>
      </div>
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

    