import { apiRequest } from "./client"

export type PurchaseCreate = {
  product_id: number
  quantity: number
  unit_purchase_price: number
  payment_status: "PAID"
}

export type PurchaseResponse = {
  purchase_id: number
  product_id: number
  quantity: number
  unit_purchase_price: number
  total_amount: number
  payment_status: string
}

export async function recordPurchase(
  purchase: PurchaseCreate
): Promise<PurchaseResponse> {
  return apiRequest<PurchaseResponse>("/purchases/", {
    method: "POST",
    body: JSON.stringify(purchase),
  })
}