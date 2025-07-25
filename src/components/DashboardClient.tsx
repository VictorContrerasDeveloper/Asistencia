"use client";

import { useState, useMemo, useEffect } from 'react';
import { type Employee, type Office, type AttendanceStatus, updateEmployee } from '@/lib/data';
import EmployeeCard from './EmployeeCard';
import AttendanceReport from './AttendanceReport';
import EditOfficeModal from './EditOfficeModal';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';

const STATUSES: AttendanceStatus[] = ['Presente', 'Atrasado', 'Ausente'];

function StatusColumn({ status, employees, onEdit }: { status: AttendanceStatus, employees: Employee[], onEdit: (employee: Employee) => void }) {
  const { setNodeRef } = useDroppable({ id: status });

  const statusConfig = {
    Presente: {
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      borderColor: 'border-green-500',
      textColor: 'text-green-800 dark:text-green-200',
    },
    Atrasado: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    Ausente: {
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      borderColor: 'border-red-500',
      textColor: 'text-red-800 dark:text-red-200',
    }
  };

  const config = statusConfig[status];

  return (
    <div ref={setNodeRef} className={`flex-1 rounded-lg p-4 min-h-[300px] transition-colors duration-300 ${config.bgColor}`}>
      <h2 className={`text-lg font-bold pb-2 mb-4 border-b-2 ${config.borderColor} ${config.textColor}`}>
        {status} ({employees.length})
      </h2>
      <div className="space-y-4">
        {employees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardClient({ initialEmployees, offices }: { initialEmployees: Employee[], offices: Office[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  const employeesByStatus = useMemo(() => {
    return STATUSES.reduce((acc, status) => {
      acc[status] = employees.filter(e => e.status === status);
      return acc;
    }, {} as Record<AttendanceStatus, Employee[]>);
  }, [employees]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const employeeId = active.id as string;
      const newStatus = over.id as AttendanceStatus;
      
      const employee = employees.find(e => e.id === employeeId);
      if(employee && employee.status !== newStatus) {
        updateEmployee(employeeId, newStatus);
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, status: newStatus } : e));
      }
    }
  };

  const handleOpenModal = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleCloseModal = () => {
    setEditingEmployee(null);
  };
  
  const handleSaveOffice = (employeeId: string, newOfficeId: string) => {
    updateEmployee(employeeId, undefined, newOfficeId);
    setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, officeId: newOfficeId } : e));
    handleCloseModal();
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-8 space-y-8">
        <AttendanceReport employeesByStatus={employeesByStatus} />
        <div className="flex flex-col md:flex-row gap-6">
          {STATUSES.map(status => (
            <StatusColumn
              key={status}
              status={status}
              employees={employeesByStatus[status]}
              onEdit={handleOpenModal}
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
    </DndContext>
  );
}
