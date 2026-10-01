import { apiRequest } from "./client"

export type PurchasePlanProduct = {
  product_id: number
  name: string
  current_stock: number
  average_daily_sales: number
  purchase_price: number
  supplier_lead_time_days: number
}

export type PurchasePlanFinance = {
  available_cash: number
  pending_customer_payments: number
  cash_reserve: number
}

export type PurchasePlanRequest = {
  products: PurchasePlanProduct[]
  finance: PurchasePlanFinance
}

export type PurchaseRecommendation = {
  product_id: number
  product_name: string
  status: string
  order_quantity: number
  unit_price: number
  total_cost: number
  days_of_stock: number
  reason: string
}

export type PurchasePlanResponse = {
  recommendations: PurchaseRecommendation[]
  total_purchase_cost: number
  spendable_cash: number
  remaining_spendable_cash: number
  cash_after_purchase: number
  protected_reserve: number
}

export async function createPurchasePlan(
  request: PurchasePlanRequest
): Promise<PurchasePlanResponse> {
  return apiRequest<PurchasePlanResponse>("/purchase-plan", {
    method: "POST",
    body: JSON.stringify(request),
  })
}
