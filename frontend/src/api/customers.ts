import { apiRequest } from "./client"

export type Customer = {
  customer_id: number
  name: string
  phone?: string | null
}

export async function getCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/customers/")
}