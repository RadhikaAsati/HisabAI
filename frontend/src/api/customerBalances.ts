import { apiRequest } from "./client"

export type CustomerBalance = {
  customer_id: number
  name: string
  phone?: string | null
  total_credit: number
  total_paid: number
  outstanding_balance: number
}

export async function getCustomerBalances(): Promise<CustomerBalance[]> {
  return apiRequest<CustomerBalance[]>("/customers/balances/")
}