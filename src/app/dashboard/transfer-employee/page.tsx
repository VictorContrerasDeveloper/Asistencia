
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shuffle, Shield, Tablet, Navigation, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getEmployees, getOffices, Office, Employee, EmployeeRole } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import TransferEmployeeModal from '@/components/TransferEmployeeModal';
import AddEmployeeModal from '@/components/AddEmployeeModal';

const ROLE_ORDER: Record<EmployeeRole, number> = {
    'Supervisión': 1,
    'Modulo': 2,
    'Tablet': 3,
    'Anfitrión': 4,
};

const DesktopIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        {...props}
    >
        <path d="M4 3C2.89543 3 2 3.89543 2 5V10C2 11.1046 2.89543 12 4 12H20C21.1046 12 22 11.1046 22 10V5C22 3.89543 21.1046 3 20 3H4ZM4 5H20V10H4V5Z" />
        <path d="M3 14C1.89543 14 1 14.8954 1 16V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V16C23 14.8954 22.1046 14 21 14H3ZM3 16H21V19H3V16Z" />
        <path d="M6 17C5.44772 17 5 17.4477 5 18C5 18.5523 5.44772 19 6 19H8C8.55228 19 9 18.5523 9 18C9 17.4477 8.55228 17 8 17H6Z" />
        <path d="M11 17C10.4477 17 10 17.4477 10 18C10 18.5523 10.4477 19 11 19H13C13.5523 19 14 18.5523 14 18C14 17.4477 13.5523 17 13 17H11Z" />
    </svg>
);


const RoleIcons: Record<EmployeeRole, React.ElementType> = {
    'Supervisión': Shield,
    'Modulo': DesktopIcon,
    'Tablet': Tablet,
    'Anfitrión': Navigation,
}


export default function TransferEmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [fetchedEmployees, fetchedOffices] = await Promise.all([
        getEmployees(),
        getOffices()
    ]);
    setEmployees(fetchedEmployees);
    setOffices(fetchedOffices);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const officeMap = useMemo(() => new Map(offices.map(o => [o.id, o.name])), [offices]);

  const employeesByOffice = useMemo(() => {
    if (loading) return {};
    return employees.reduce((acc, employee) => {
      const officeName = officeMap.get(employee.officeId) || 'Sin Oficina';
      if (!acc[officeName]) {
        acc[officeName] = [];
      }
      acc[officeName].push(employee);
      return acc;
    }, {} as Record<string, Employee[]>);
  }, [employees, officeMap, loading]);


  const handleOpenTransferModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsTransferModalOpen(true);
  };
  
  const handleSuccess = async () => {
    setIsTransferModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedEmployee(null);
    await fetchData(); // Refresh data
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
         <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/manual-entry">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className='flex flex-col'>
                <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Trasladar Personal</h1>
                <p className="text-sm text-muted-foreground">
                    Haz clic en el icono de traslado para reasignar un ejecutivo a una nueva oficina.
                </p>
            </div>
          </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar Personal
            </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                 {loading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                  Object.keys(employeesByOffice).sort().map(officeName => (
                    <Card key={officeName} className="flex flex-col">
                      <CardHeader className="p-3">
                        <CardTitle className="text-base">{officeName} ({employeesByOffice[officeName].length})</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 overflow-y-auto">
                        {employeesByOffice[officeName]
                          .sort((a, b) => {
                            const roleA = ROLE_ORDER[a.role] || 99;
                            const roleB = ROLE_ORDER[b.role] || 99;
                            if(roleA !== roleB) {
                                return roleA - roleB;
                            }
                            return a.name.localeCompare(b.name);
                          })
                          .map(employee => {
                            const Icon = RoleIcons[employee.role] || Navigation;
                            return (
                                <div key={employee.id} className="flex items-center justify-between py-0 px-1 rounded-md hover:bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="font-medium text-sm">{employee.name}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenTransferModal(employee)}>
                                        <Shuffle className="h-4 w-4 text-primary" />
                                    </Button>
                                </div>
                            )
                          })}
                      </CardContent>
                    </Card>
                  ))
                )}
                
                {!loading && employees.length === 0 && (
                    <p className="text-center text-muted-foreground py-8 col-span-full">
                        No hay personal para mostrar.
                    </p>
                )}
              </div>
        </main>
      </div>
      {selectedEmployee && (
        <TransferEmployeeModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          employee={selectedEmployee}
          offices={offices}
          onSuccess={handleSuccess}
        />
      )}
      <AddEmployeeModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
      />
    </>
  );
}
