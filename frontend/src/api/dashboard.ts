import { apiRequest } from "./client"

export type DashboardTransaction = {
  sale_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_selling_price: number
  total_amount: number
  payment_mode: "CASH" | "CREDIT"
  created_at: string
}

export type InventoryAlert = {
  product_id: number
  name: string
  current_stock: number
  average_daily_sales: number
  days_of_stock: number
}

export type DashboardResponse = {
  shop: {
    shop_id: number
    shop_name: string
  }

  summary: {
    available_cash: number
    today_sales: number
    outstanding_credit: number
  }

  inventory: {
    total_products: number
    alert_count: number
    alerts: InventoryAlert[]
  }

  recent_transactions: DashboardTransaction[]
}

export async function getDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/dashboard/")
}
