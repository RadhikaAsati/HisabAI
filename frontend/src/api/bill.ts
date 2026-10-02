export type BillItemExtraction = {
  product_name: string
  quantity: number
  unit_price: number
  total_amount: number
}

export type BillExtraction = {
  supplier_name: string | null
  customer_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  items: BillItemExtraction[]
  grand_total: number | null
  confidence: number
}

export type BillScanResponse = {
  filename: string
  extraction: BillExtraction
}

export type BillConfirmationItem = {
  product_id: number
  quantity: number
  unit_selling_price: number
}

export type BillConfirmation = {
  customer_id: number | null
  payment_mode: "CASH" | "UPI" | "CREDIT"
  items: BillConfirmationItem[]
}

export type BillConfirmationResponse = {
  message: string
  bill: {
    total_amount: number
    payment_mode: "CASH" | "UPI" | "CREDIT"
    customer_id: number | null
    items: {
      product_id: number
      quantity: number
      unit_selling_price: number
      total_amount: number
    }[]
    credit_id: number | null
  }
}

export async function scanBill(
  file: File,
): Promise<BillScanResponse> {
  const token = localStorage.getItem("hisabai-token")

  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(
    "http://127.0.0.1:8000/ai/scan-bill",
    {
      method: "POST",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      body: formData,
    },
  )

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      errorText || `Bill scan failed: ${response.status}`,
    )
  }

  return response.json() as Promise<BillScanResponse>
}

export async function confirmScannedBill(
  confirmation: BillConfirmation,
): Promise<BillConfirmationResponse> {
  const token = localStorage.getItem("hisabai-token")

  const response = await fetch(
    "http://127.0.0.1:8000/ai/scan-bill/confirm",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
      body: JSON.stringify(confirmation),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()

    throw new Error(
      errorText ||
        `Bill confirmation failed: ${response.status}`,
    )
  }

  return response.json() as Promise<BillConfirmationResponse>
}