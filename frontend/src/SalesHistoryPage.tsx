import { useEffect, useState } from "react"
import { apiRequest } from "./api/client"

type Sale = {
  sale_id: number
  product_id: number
  product_name: string
  quantity: number
  unit_selling_price: number
  total_amount: number
  payment_mode: "CASH" | "UPI" | "CREDIT"
  created_at: string
}

type Props = {
  onBack: () => void
}

export default function SalesHistoryPage({ onBack }: Props) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSales() {
      try {
        const data = await apiRequest<Sale[]>("/sales/")
        setSales(data)
      } catch (error) {
        console.error("Failed to load sales:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSales()
  }, [])

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const totalSales = sales.reduce(
    (sum, sale) => sum + sale.total_amount,
    0
  )

  return (
    <div className="min-h-screen bg-[#eef5f4] px-6 py-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="mb-3 text-sm font-medium text-[#16706e] hover:underline"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-[#123b3b]">
              Sales History
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              All recorded sales from your shop
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">
              Total Recorded Sales
            </p>
            <p className="mt-1 text-2xl font-bold text-[#16706e]">
              ₹{totalSales.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading sales history...
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-3 text-4xl">🧾</div>
              <h2 className="font-semibold text-[#123b3b]">
                No sales recorded yet
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Your completed sales will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b bg-[#f7faf9]">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Product
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Unit Price
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date & Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.sale_id}
                      className="border-b last:border-0 hover:bg-[#f8fbfa]"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#123b3b]">
                          {sale.product_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          Sale #{sale.sale_id}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {sale.quantity}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        ₹{sale.unit_selling_price.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 font-semibold text-[#123b3b]">
                        ₹{sale.total_amount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            sale.payment_mode === "CREDIT"
                              ? "bg-[#fff4d8] text-[#9a6a00]"
                              : sale.payment_mode === "UPI"
                              ? "bg-[#f4efff] text-[#7658df]"
                              : "bg-[#eaf7f1] text-[#16706e]"
                          }`}
                        >
                          {sale.payment_mode}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(sale.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}