import { apiRequest } from "./client"

export type BillingItem = {
  product_id: number
  quantity: number
  unit_selling_price: number
}

export type BillingRequest = {
  customer_id?: number | null
  payment_mode: "CASH" | "UPI" | "CREDIT"
  items: BillingItem[]
}

export type BillingResponse = {
  bill_id?: number
  items?: unknown[]
  total_amount?: number
  payment_mode?: string
  customer_id?: number | null
  [key: string]: unknown
}

export async function createBill(
  request: BillingRequest
): Promise<BillingResponse> {
  return apiRequest<BillingResponse>("/billing/", {
    method: "POST",
    body: JSON.stringify(request),
  })
}