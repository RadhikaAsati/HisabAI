import { apiRequest } from "./client"

export type Product = {
  product_id: number
  name: string
  current_stock: number
  average_daily_sales: number
  purchase_price: number
  supplier_lead_time_days: number
}

export async function getProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/products/")
}
