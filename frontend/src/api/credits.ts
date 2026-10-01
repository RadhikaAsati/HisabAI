import { apiRequest } from "./client"

export type Credit = {
  credit_id: number
  customer_id: number
  amount: number
  paid_amount?: number
  description?: string | null
}

export type CreditPaymentRequest = {
  credit_id: number
  amount: number
  payment_method: "CASH" | "UPI"
}

export type CreditPaymentResponse = {
  payment_id: number
  credit_id: number
  amount: number
  payment_method: string
}

export async function getCredits(): Promise<Credit[]> {
  return apiRequest<Credit[]>("/credits/")
}

export async function createCreditPayment(
  request: CreditPaymentRequest
): Promise<CreditPaymentResponse> {
  return apiRequest<CreditPaymentResponse>("/credits/payments/", {
    method: "POST",
    body: JSON.stringify(request),
  })
}