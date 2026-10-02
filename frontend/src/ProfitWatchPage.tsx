import { useEffect, useState } from "react"
import { apiRequest } from "./api/client"

type ProfitProduct = {
  product_id: number
  product_name: string
  quantity_sold: number
  sales_revenue: number
  cost: number
  gross_profit: number
  margin_percentage: number
  status: "WATCH" | "HEALTHY"
}

type ProfitWatchResponse = {
  shop_name: string
  summary: {
    total_sales: number
    total_cost: number
    gross_profit: number
    overall_margin_percentage: number
  }
  products: ProfitProduct[]
}

export default function ProfitWatchPage() {
  const [data, setData] = useState<ProfitWatchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadProfitWatch() {
      try {
        const response = await apiRequest<ProfitWatchResponse>(
          "/ai/profit-watch",
        )

        setData(response)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load Profit Watch.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadProfitWatch()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="font-semibold text-[#123b3b]">
            Loading your profit picture...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Could not load Profit Watch</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const watchProducts = data.products.filter(
    (product) => product.status === "WATCH",
  )

  const healthyProducts = data.products.filter(
    (product) => product.status === "HEALTHY",
  )

  return (
    <div className="space-y-7">
      {/* Header */}
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#ef684b]">
              Profit Watch
            </p>

            <h1 className="text-3xl font-black tracking-tight text-[#123b3b]">
              Where is your money actually going?
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#58706f]">
              See which products are contributing to your profit — and which
              ones need attention.
            </p>
          </div>

          <div className="rounded-2xl border border-[#cfe0de] bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#78908e]">
              Shop
            </p>
            <p className="mt-1 font-bold text-[#123b3b]">
              {data.shop_name}
            </p>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Estimated Gross Profit"
          value={`₹${data.summary.gross_profit.toLocaleString("en-IN")}`}
          helper={`₹${data.summary.total_sales.toLocaleString(
            "en-IN",
          )} sales`}
          icon="₹"
          iconClass="bg-[#eaf7f1] text-[#168064]"
        />

        <SummaryCard
          label="Overall Margin"
          value={`${data.summary.overall_margin_percentage.toFixed(2)}%`}
          helper="Across recorded sales"
          icon="%"
          iconClass="bg-[#f4efff] text-[#7658df]"
        />

        <SummaryCard
          label="Total Sales"
          value={`₹${data.summary.total_sales.toLocaleString("en-IN")}`}
          helper={`Estimated cost ₹${data.summary.total_cost.toLocaleString(
            "en-IN",
          )}`}
          icon="↗"
          iconClass="bg-[#fff4d8] text-[#b87800]"
        />

        <SummaryCard
          label="Products to Watch"
          value={String(watchProducts.length)}
          helper={`${healthyProducts.length} healthy`}
          icon="!"
          iconClass="bg-[#fff0ec] text-[#e95e42]"
        />
      </section>

      {/* Main insight */}
      <section className="rounded-3xl border border-[#cfe0de] bg-[#073f40] p-6 text-white shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4b632] text-xl font-black text-[#123b3b]">
            ✦
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f4d77d]">
              HisabAI Insight
            </p>

            <p className="mt-2 text-sm leading-6 text-[#e6f0ef]">
              {watchProducts.length > 0
                ? `${watchProducts
                    .map((product) => product.product_name)
                    .join(
                      ", ",
                    )} ${watchProducts.length === 1 ? "needs" : "need"} a closer look because ${watchProducts.length === 1 ? "its" : "their"} recorded margin is below the current Profit Watch threshold.`
                : "Your recorded products are currently above the Profit Watch threshold."}
            </p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="overflow-hidden rounded-3xl border border-[#cfe0de] bg-white shadow-sm">
        <div className="border-b border-[#e4eceb] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#123b3b]">
                Product Profitability
              </h2>

              <p className="mt-1 text-sm text-[#708786]">
                Estimated gross profit based on recorded purchase cost.
              </p>
            </div>

            <div className="rounded-full bg-[#fff4d8] px-4 py-2 text-xs font-bold text-[#9a6800]">
              {watchProducts.length} need attention
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#edf2f1]">
          {data.products.map((product) => {
            const isWatch = product.status === "WATCH"
            const isLoss = product.gross_profit < 0

            return (
              <div
                key={product.product_id}
                className="px-6 py-5 transition hover:bg-[#f8fbfa]"
              >
                <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] lg:items-center">
                  {/* Product */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black ${
                        isWatch
                          ? "bg-[#fff0ec] text-[#e95e42]"
                          : "bg-[#eaf7f1] text-[#168064]"
                      }`}
                    >
                      {isWatch ? "!" : "✓"}
                    </div>

                    <div>
                      <p className="font-bold text-[#123b3b]">
                        {product.product_name}
                      </p>

                      <p className="text-xs text-[#78908e]">
                        {product.quantity_sold} units sold
                      </p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <Metric
                    label="Sales Revenue"
                    value={`₹${product.sales_revenue.toLocaleString(
                      "en-IN",
                    )}`}
                  />

                  {/* Cost */}
                  <Metric
                    label="Recorded Cost"
                    value={`₹${product.cost.toLocaleString("en-IN")}`}
                  />

                  {/* Profit */}
                  <Metric
                    label="Gross Profit"
                    value={`${
                      product.gross_profit < 0 ? "-₹" : "₹"
                    }${Math.abs(product.gross_profit).toLocaleString(
                      "en-IN",
                    )}`}
                    valueClass={
                      isLoss
                        ? "text-[#e95e42]"
                        : "text-[#168064]"
                    }
                  />

                  {/* Status */}
                  <div className="flex items-center justify-start lg:justify-end">
                    <div
                      className={`rounded-full px-4 py-2 text-xs font-black ${
                        isWatch
                          ? "bg-[#fff0ec] text-[#d84d35]"
                          : "bg-[#eaf7f1] text-[#168064]"
                      }`}
                    >
                      {isWatch ? "WATCH" : "HEALTHY"}
                    </div>
                  </div>
                </div>

                {/* Margin bar */}
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#78908e]">
                      Margin
                    </span>

                    <span
                      className={`font-black ${
                        isWatch
                          ? "text-[#e95e42]"
                          : "text-[#168064]"
                      }`}
                    >
                      {product.margin_percentage.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#edf2f1]">
                    <div
                      className={`h-full rounded-full ${
                        isWatch
                          ? "bg-[#ef684b]"
                          : "bg-[#35b38e]"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.max(product.margin_percentage, 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer note */}
      <div className="rounded-2xl border border-[#dfe9e7] bg-[#f4f8f7] px-5 py-4 text-xs leading-5 text-[#647d7b]">
        <strong className="text-[#123b3b]">
          How Profit Watch works:
        </strong>{" "}
        gross profit is estimated from recorded sales revenue minus the
        product's recorded purchase cost. Profit Watch currently flags
        products below the configured margin threshold for review.
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  iconClass,
}: {
  label: string
  value: string
  helper: string
  icon: string
  iconClass: string
}) {
  return (
    <div className="rounded-3xl border border-[#d6e4e2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#78908e]">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-[#123b3b]">
            {value}
          </p>

          <p className="mt-1 text-xs text-[#78908e]">
            {helper}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  valueClass = "text-[#123b3b]",
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#8aa09e]">
        {label}
      </p>

      <p className={`mt-1 font-black ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}