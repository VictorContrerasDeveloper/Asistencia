
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
} from 'firebase/firestore';

export type Office = {
  id: string;
  name: string;
};

export type AttendanceStatus = 'Presente' | 'Atrasado' | 'Ausente';

export type Employee = {
  id:string;
  name: string;
  officeId: string;
  status: AttendanceStatus;
};

const db = getFirestore(app);
const officesCollection = collection(db, 'offices');
const employeesCollection = collection(db, 'employees');

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/[\.com-]+/g, "") // remove .com
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const getOffices = async (): Promise<Office[]> => {
    const snapshot = await getDocs(officesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
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


export const getOfficeBySlug = async (slug: string): Promise<Office | undefined> => {
  const q = query(officesCollection);
  const snapshot = await getDocs(q);
  const offices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Office));
  return offices.find(office => slugify(office.name) === slug);
}

export const getEmployees = async (officeSlug?: string): Promise<Employee[]> => {
  if (!officeSlug || officeSlug === 'general') {
    const snapshot = await getDocs(employeesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  }
  
  const office = await getOfficeBySlug(officeSlug);
  if (!office) {
    return [];
  }
  
  const q = query(employeesCollection, where('officeId', '==', office.id));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const updateEmployee = async (employeeId: string, updates: Partial<Pick<Employee, 'status' | 'officeId'>>) => {
    const employeeRef = doc(db, 'employees', employeeId);
    await updateDoc(employeeRef, updates);
    const updatedDoc = await getDoc(employeeRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Employee;
}

export const addEmployee = async (name: string, officeId: string) => {
  const newEmployee = {
    name,
    officeId,
    status: 'Atrasado', // Default status
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
      status: 'Atrasado',
    };
    const docRef = doc(employeesCollection); // Automatically generate new doc ID
    batch.set(docRef, newEmployee);
  });

  await batch.commit();
}

export const deleteEmployee = async (employeeId: string) => {
  const employeeRef = doc(db, 'employees', employeeId);
  await deleteDoc(employeeRef);
};
