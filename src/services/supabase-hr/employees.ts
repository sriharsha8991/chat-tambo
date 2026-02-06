import { getDb, isSupabaseConfigured, Employee } from './base';

export async function getEmployee(employeeId: string): Promise<Employee | null> {
  if (!isSupabaseConfigured()) return null;
  const db = getDb();

  const { data, error } = await db
    .from('employees')
    .select('*')
    .or(`id.eq.${employeeId},employee_id.eq.${employeeId}`)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return data as Employee | null;
}

export async function getEmployeeByEmployeeId(employeeId: string): Promise<Employee | null> {
  if (!isSupabaseConfigured()) return null;
  const db = getDb();

  const { data, error } = await db
    .from('employees')
    .select('*')
    .eq('employee_id', employeeId)
    .single();

  if (error) {
    console.error('Error fetching employee by employee_id:', error);
    return null;
  }

  return data as Employee | null;
}

export async function getDirectReports(managerId: string): Promise<Employee[]> {
  if (!isSupabaseConfigured()) return [];

  // First, resolve managerId to UUID if it's an employee_id
  let managerUuid = managerId;
  if (!managerId.includes('-') || managerId.startsWith('ZP-')) {
    const manager = await getEmployeeByEmployeeId(managerId);
    if (manager) managerUuid = manager.id;
  }

  const { data, error } = await getDb()
    .from('employees')
    .select('*')
    .eq('manager_id', managerUuid);

  if (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }

  return (data as Employee[]) || [];
}

export async function getAllEmployees(): Promise<Employee[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getDb()
    .from('employees')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all employees:', error);
    return [];
  }

  return (data as Employee[]) || [];
}
