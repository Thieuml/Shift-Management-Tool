import { z } from "zod";

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Example: Payroll validation schema
export const payrollSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  amount: z.number().positive("Amount must be positive"),
  period: z.string().min(1, "Period is required"),
});

// Example: Admin operation schema
export const adminOperationSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  resource: z.string().min(1, "Resource is required"),
  data: z.record(z.unknown()),
});
