
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


// Initial data for seeding
const initialOffices: Omit<Office, 'id'>[] = [
  { name: 'Of. Com. Maipú' },
  { name: 'Of. Com. Gran Avenida' },
  { name: 'Of. Com. Plaza Egaña' },
  { name: 'Of. Com. Mall Plaza Norte' },
  { name: 'Of. Com. Centro' },
  { name: 'Of. Com. Providencia' },
  { name: 'Sub. Gerente Helpbank' },
  { name: 'Prevencion Riesgo' },
];

const initialEmployees: Omit<Employee, 'id'>[] = [
    { name: 'Patricia Astorga Soto', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Patricia Ríos Contreras', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Leyla Andrea Soto García', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Jorge Alexis Martínez Tapia', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Johanna Contreras Salfate', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jesennia Torres Aguilar', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Carlos Vera Carvajal', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Jenny Llanillos Aguilar', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Paula Andrea Muñoz Ceriani', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Clarisa Silva Maldonado', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Maria Soledad Zuñiga Hernandez', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Carola Andrea Valladares Poblete', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Solanch Quezada Morales', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Marisol Abarca Toro', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Patricia Reyes Osorio', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Nicole Belen Muñoz Silva', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Sixtina Rojo Astorga', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Athan Alonso Abarca Vidal', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Rosaliz Pacheco Asuaje', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Sandra Alarcon Parada', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Yaritza Huaiquinao Peñaloza', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Fabian Jesus Muñoz Ceriani', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Teresa del Carmen Marillanca Torres', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Karina Andrea Sobino Perez', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Marisol Cornejo Díaz', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Paulina Gloria Opazo Villalobos', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Nicole Martinez Escobar', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Nisnoibeth Rodriguez Nery', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Mary Cruz Oviedo De Cedeño', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Constanza Antonia Azocar Bascuñan', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Jessica Rodríguez Anríquez', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Annais Arenas Pardo', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jocelyn de Lourdes Larenas Jimenez', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Muriel Andrea Aranguiz Lazo', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Margott Vidal Gómez', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Lucia Begoña Vargas Paillan', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Analia Adriazola Quintupill', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Oscar Boris Soto Muñoz', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Gisel Olivares Jofre', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Anchely Taborda de Ortega', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Fresia Miranda Diaz', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jaidemarie Deutelmoser', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Isabel Margarita Riquelme Sepulveda', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Ana Belen Bascur Salas', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Consuelo del Pilar Salazar Roman', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Alexandra Rodriguez silva', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Josefa Antonia Leal Pirela', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Erika Caceres Lobos', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Reina Bueno Gateño', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Vanesa Rojas Peña', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Maria Angelica Valenzuela Hernandez', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Jose Luis Cañas Caicedo', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Lilian Gutiérrez Velásquez', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Violeta Astorga Maturana', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Jhaneilis Vera Montiel', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Valeria Irene Lizama Guzmán', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Flor Maria Diaz Hernandez', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Marcela Gonzalez Liempi', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Maritza Norambuena Estay', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Javiera Paz Fernandez Ramirez', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Magaly Sonia Retamal Castro', officeId: 'Of. Com. Plaza Egaña', status: 'Atrasado' },
    { name: 'Aida Farfan Gutierrez', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Benjamín Ignacio Martinez Mallega', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Camila Marillanaca', officeId: 'Of. Com. Maipu', status: 'Atrasado' },
    { name: 'Catalina Rojas Barrales', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Michelle Casanova Gutierrez', officeId: 'Of. Com. Gran Avenida', status: 'Atrasado' },
    { name: 'Evelyn Robinson Mallega', officeId: 'Of. Com. Providencia', status: 'Atrasado' },
    { name: 'Jocelyn Alejandra Pino Pinto', officeId: 'Of. Com. Centro', status: 'Atrasado' },
    { name: 'Julissa Andrea Venegas Carreño', officeId: 'Of. Com. Mall Plaza Norte', status: 'Atrasado' },
    { name: 'Fernando Hernandez', officeId: 'Sub. Gerente Helpbank', status: 'Atrasado' },
    { name: 'Christian Lezana', officeId: 'Prevencion Riesgo', status: 'Atrasado' },
];

async function seedDatabase() {
  const officesSnapshot = await getDocs(query(officesCollection));
  if (officesSnapshot.empty) {
    const officePromises = initialOffices.map(office => addDoc(officesCollection, office));
    const officeDocs = await Promise.all(officePromises);

    const officeNameToIdMap = new Map<string, string>();
    officeDocs.forEach((doc, index) => {
        officeNameToIdMap.set(initialOffices[index].name, doc.id);
    });
    
    const employeePromises = initialEmployees.map(employee => {
      const officeId = officeNameToIdMap.get(employee.officeId);
      if(officeId) {
        return addDoc(employeesCollection, { ...employee, officeId });
      }
      return null;
    }).filter(p => p !== null);

    await Promise.all(employeePromises);
  }
}

seedDatabase();

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

export const getOfficeById = async (id: string): Promise<Office | undefined> => {
  const docRef = doc(db, 'offices', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Office;
  }
  return undefined;
};


export const getOfficeBySlug = async (slug: string): Promise<Office | undefined> => {
  const offices = await getOffices();
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
