import type { Employee } from './base';
import { getEmployee, getEmployeeByEmployeeId } from './employees';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function resolveEmployeeUuid(employeeId: string): Promise<string> {
  if (!isUuid(employeeId)) {
    const employee = await getEmployeeByEmployeeId(employeeId);
    return employee?.id ?? employeeId;
  }

  return employeeId;
}

export async function resolveEmployee(employeeId: string): Promise<Employee | null> {
  if (!isUuid(employeeId)) {
    return getEmployeeByEmployeeId(employeeId);
  }

  return getEmployee(employeeId);
}
