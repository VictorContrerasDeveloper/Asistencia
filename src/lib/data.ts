
import { app } from './firebase';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  addDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  documentId,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export type Office = {
  id: string;
  name: string;
  theoreticalStaffing?: {
    [key in EmployeeRole]?: number;
  };
  realStaffing?: {
    [key in EmployeeRole]?: number;
  };
};

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Atrasado';
export type AbsenceReason = 'Inasistencia' | 'Licencia médica' | 'Vacaciones' | 'Otro' | null;
export type EmployeeRole = 'Modulo' | 'Anfitrión' | 'Tablet' | 'Supervisión';
export type EmployeeLevel = 'Nivel 1' | 'Nivel 2' | 'Nivel intermedio' | 'Nivel Básico';

export type Employee = {
  id:string;
  name: string;
  officeId: string;
  status: AttendanceStatus;
  absenceReason: AbsenceReason;
  role: EmployeeRole;
  level: EmployeeLevel;
  absenceEndDate?: string | null;
};

export type DailySummary = {
  id: string;
  date: Timestamp;
  summary: {
    [officeId: string]: {
      name: string;
      realStaffing: {
        [key in EmployeeRole]?: number;
      };
       theoreticalStaffing: {
        [key in EmployeeRole]?: number;
      };
      absent: string;
      prolongedAbsences: string;
    };
  };
};


const db = getFirestore(app);
const officesCollection = collection(db, 'offices');
const employeesCollection = collection(db, 'employees');
const dailySummariesCollection = collection(db, 'dailySummaries');

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

const STATIC_OFFICE_ORDER = [
  'Of. Com. Centro',
  'Of. Com. Maipu',
  'Of. Com. Providencia',
  'Of. Com. Gran Avenida',
  'Of. Com. Plaza Egaña',
  'Of. Com. Mall Plaza Norte',
  'Of. Com. Movil'
];

export const getOffices = async (): Promise<Office[]> => {
    const snapshot = await getDocs(query(officesCollection));
    const offices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
    
    return offices.sort((a, b) => {
        const indexA = STATIC_OFFICE_ORDER.indexOf(a.name);
        const indexB = STATIC_OFFICE_ORDER.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        return a.name.localeCompare(b.name);
    });
};

export const addOffice = async (name: string) => {
  const newOffice = {
    name,
  };
  const docRef = await addDoc(officesCollection, newOffice);
  return { id: docRef.id, ...newOffice } as Office;
};

export const getOfficeById = async (id: string): Promise<Office | undefined> => {
  if (!id) return undefined;
  const docRef = doc(db, 'offices', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Office;
  }
  return undefined;
};

export const updateOfficeStaffing = async (officeId: string, theoreticalStaffing: { [key in EmployeeRole]?: number }) => {
  const officeRef = doc(db, 'offices', officeId);
  await updateDoc(officeRef, { theoreticalStaffing });
}

export const clearAllRealStaffing = async (officeIds: string[]) => {
    const batch = writeBatch(db);
    const clearedStaffing = {
        Modulo: 0,
        Anfitrión: 0,
        Tablet: 0,
        Supervisión: 0,
    };
    officeIds.forEach(id => {
        const officeRef = doc(db, 'offices', id);
        batch.update(officeRef, { realStaffing: clearedStaffing });
    });
    await batch.commit();
}

export const updateOfficeRealStaffing = async (officeId: string, realStaffing: { [key in EmployeeRole]?: number }) => {
    const officeRef = doc(db, 'offices', officeId);
    
    const officeDoc = await getDoc(officeRef);
    if(!officeDoc.exists()) {
        throw new Error("Office not found");
    }

    const currentStaffing = officeDoc.data().realStaffing || {};
    
    // Ensure 0 is saved if that's the value, otherwise merge
    const updatedStaffing: { [key in EmployeeRole]?: number } = { ...currentStaffing };
    for (const role in realStaffing) {
        const key = role as EmployeeRole;
        const value = realStaffing[key];
        if (value !== undefined) {
          updatedStaffing[key] = value;
        }
    }
    
    await updateDoc(officeRef, { realStaffing: updatedStaffing });
};

export const getOfficeBySlug = async (slug: string, offices?: Office[]): Promise<Office | undefined> => {
  if (!slug) return undefined;
  const officeList = offices || await getOffices();
  return officeList.find(office => slugify(office.name) === slug);
}

export const getEmployees = async (officeId?: string): Promise<Employee[]> => {
  let q;
  if (!officeId || officeId === 'general') {
    q = query(employeesCollection);
  } else {
    q = query(employeesCollection, where('officeId', '==', officeId));
  }
  const snapshot = await getDocs(q);
  const employees = snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      level: data.level || 'Nivel Básico' // Ensure level has a default value
    } as Employee
  });
  return employees.sort((a,b) => a.name.localeCompare(b.name));
};

export const updateEmployee = async (employeeId: string, updates: Partial<Employee>) => {
    const employeeRef = doc(db, 'employees', employeeId);
    
    const finalUpdates: { [key: string]: any } = {};
    for(const key in updates) {
        const value = updates[key as keyof Employee];
        if(value !== undefined) {
            finalUpdates[key] = value;
        }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'absenceReason') && updates.absenceReason === null) {
      finalUpdates.absenceReason = null;
    }
     if (Object.prototype.hasOwnProperty.call(updates, 'absenceEndDate') && updates.absenceEndDate === null) {
      finalUpdates.absenceEndDate = null;
    }

    await updateDoc(employeeRef, finalUpdates);
};

export const bulkUpdateEmployeeNames = async (updates: { employeeId: string, name: string }[]): Promise<void> => {
    if (updates.length === 0) {
        return;
    }

    const batch = writeBatch(db);
    updates.forEach(update => {
        const employeeRef = doc(db, 'employees', update.employeeId);
        batch.update(employeeRef, { name: update.name });
    });
    
    await batch.commit();
}

export const bulkUpdateEmployeeLevels = async (updates: { employeeId: string, level: EmployeeLevel }[]): Promise<void> => {
    if(updates.length === 0) {
        return;
    }
    const batch = writeBatch(db);
    updates.forEach(update => {
        const employeeRef = doc(db, 'employees', update.employeeId);
        batch.update(employeeRef, { level: update.level });
    });
    await batch.commit();
}


export const addEmployee = async (name: string, officeId: string, role: EmployeeRole, level: EmployeeLevel) => {
  const newEmployee = {
    name,
    officeId,
    status: 'Presente',
    absenceReason: null,
    role: role || 'Modulo',
    level: level || 'Nivel Básico',
    absenceEndDate: null
  };
  const docRef = await addDoc(employeesCollection, newEmployee);
  return { id: docRef.id, ...newEmployee } as Employee;
};

export const bulkAddEmployees = async (names: string, officeId: string) => {
  const nameList = names.split('\n').filter(name => name.trim() !== '');
  if (nameList.length === 0) {
    return;
  }

  const batch = writeBatch(db);
  nameList.forEach(name => {
    const newEmployee = {
      name: name.trim(),
      officeId,
      status: 'Presente',
      absenceReason: null,
      role: 'Modulo',
      level: 'Nivel Básico',
      absenceEndDate: null
    };
    const docRef = doc(employeesCollection);
    batch.set(docRef, newEmployee);
  });

  await batch.commit();
}

export const deleteEmployee = async (employeeId: string) => {
  const employeeRef = doc(db, 'employees', employeeId);
  await deleteDoc(employeeRef);
};

export const bulkDeleteEmployees = async (employeeIds: string[]) => {
  if (employeeIds.length === 0) {
    return;
  }
  const batch = writeBatch(db);
  employeeIds.forEach(id => {
    const docRef = doc(db, 'employees', id);
    batch.delete(docRef);
  });
  await batch.commit();
}

export const saveDailySummary = async (date: Date, summary: any) => {
  await addDoc(dailySummariesCollection, {
    date: Timestamp.fromDate(date),
    summary,
  });
}

export const getDailySummaries = async (): Promise<DailySummary[]> => {
  const q = query(dailySummariesCollection, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailySummary));
}

export const deleteDailySummary = async (summaryId: string) => {
  if (!summaryId) return;
  const summaryRef = doc(db, 'dailySummaries', summaryId);
  await deleteDoc(summaryRef);
};
