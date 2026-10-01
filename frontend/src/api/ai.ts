import { apiRequest } from "./client"

export type TransactionExtraction = {
  transaction_type: "SALE" | "PURCHASE" | "EXPENSE"
  product_name: string | null
  quantity: number | null
  amount: number | null
  description: string | null
  confidence: number
}

export type ProductMatch = {
  product_id: number
  name: string
  current_stock: number
  purchase_price: number
}

export type VoiceEntryResponse = {
  extraction: TransactionExtraction
  product_match: ProductMatch | null
}

export type VoiceSaleConfirmation = {
  product_id: number
  quantity: number
  total_amount: number
  payment_mode: "CASH" | "UPI"
}

export type VoiceConfirmationResponse = {
  message: string
  product_id: number
  quantity: number
  unit_selling_price: number
  total_amount: number
  payment_mode: "CASH" | "UPI"
  remaining_stock: number
}

export async function extractVoiceEntry(
  text: string,
): Promise<VoiceEntryResponse> {
  return apiRequest<VoiceEntryResponse>(
    "/ai/voice-entry",
    {
      method: "POST",
      body: JSON.stringify({ text }),
    },
  )
}

export async function confirmVoiceSale(
  confirmation: VoiceSaleConfirmation,
): Promise<VoiceConfirmationResponse> {
  return apiRequest<VoiceConfirmationResponse>(
    "/ai/voice-entry/confirm",
    {
      method: "POST",
      body: JSON.stringify(confirmation),
    },
  )
}