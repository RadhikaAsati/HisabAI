import { useEffect, useState } from "react"
import { getDashboard } from "./api/dashboard"
import type { DashboardResponse } from "./api/dashboard"
import { useLanguage } from "./i18n/useLanguage"
import { LanguageSelector } from "./components/LanguageSelector"

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function App() {
  const { language, setLanguage } = useLanguage()

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError("")

        const data = await getDashboard()

        setDashboard(data)
      } catch (err) {
        console.error(err)

        setError(
          "Unable to load your shop data. Please check that the backend is running.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee]">
        <div className="text-center">
          <div className="mb-3 text-3xl">💜</div>

          <p className="font-semibold text-[#243044]">
            Loading HisabAI...
          </p>

          <p className="mt-1 text-sm text-[#687181]">
            Getting your shop data
          </p>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f3ee] p-6">
        <div className="max-w-md rounded-2xl border border-[#dddcd6] bg-[#fffdfb] p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">⚠️</div>

          <h1 className="text-xl font-bold text-[#243044]">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm text-[#687181]">
            {error}
          </p>
        </div>
      </div>
    )
  }

  const {
    shop,
    summary,
    inventory,
    recent_transactions,
  } = dashboard

  return (
    <div className="min-h-screen bg-[#f5f3ee] pb-24">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-20 bg-[#243754] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <div>
            <div className="text-xl font-black tracking-tight">
              Hisab<span className="text-[#c59a3a]">AI</span>
            </div>

            <p className="mt-0.5 text-[11px] text-white/65">
              Your Shop. Your Numbers. Your Language.
            </p>
          </div>

          <LanguageSelector
            language={language}
            onChange={setLanguage}
          />

        </div>
      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-7 lg:px-8">

        {/* Greeting */}

        <section className="mb-7">
          <p className="text-sm font-medium text-[#687181]">
            Good morning
          </p>

          <h1 className="serif mt-1 text-3xl font-bold text-[#243044]">
            {shop.shop_name}
          </h1>

          <p className="mt-2 text-sm text-[#687181]">
            Here's what's happening in your shop today.
          </p>
        </section>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="grid gap-4 md:grid-cols-3">

          {/* Sales */}

          <div className="section-sales rounded-2xl border border-[#c75a46]/15 p-5">

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#243044]">
                Today's Sales
              </span>

              <span className="rounded-full bg-[#fffdfb]/70 px-2.5 py-1 text-xs font-bold text-[#c75a46]">
                SALES
              </span>
            </div>

            <div className="ledger-number mt-5 text-3xl font-black text-[#243044]">
              {formatMoney(summary.today_sales)}
            </div>

            <p className="mt-2 text-xs text-[#687181]">
              Total sales recorded today
            </p>

          </div>


          {/* Cash */}

          <div className="section-cash rounded-2xl border border-[#3d7a5a]/15 p-5">

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#243044]">
                Available Cash
              </span>

              <span className="rounded-full bg-[#fffdfb]/70 px-2.5 py-1 text-xs font-bold text-[#3d7a5a]">
                CASH
              </span>
            </div>

            <div className="ledger-number mt-5 text-3xl font-black text-[#243044]">
              {formatMoney(summary.available_cash)}
            </div>

            <p className="mt-2 text-xs text-[#687181]">
              Cash available for business decisions
            </p>

          </div>


          {/* Udhaar */}

          <div className="section-udhaar rounded-2xl border border-[#c75a46]/15 p-5">

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#243044]">
                Outstanding Udhaar
              </span>

              <span className="rounded-full bg-[#fffdfb]/70 px-2.5 py-1 text-xs font-bold text-[#c75a46]">
                CREDIT
              </span>
            </div>

            <div className="ledger-number mt-5 text-3xl font-black text-[#243044]">
              {formatMoney(summary.outstanding_credit)}
            </div>

            <p className="mt-2 text-xs text-[#687181]">
              Customer payments still pending
            </p>

          </div>

        </section>


        {/* =================================================
            ATTENTION
        ================================================= */}

        <section className="mt-8">

          <div className="mb-4 flex items-end justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687181]">
                Inventory
              </p>

              <h2 className="serif mt-1 text-2xl font-bold text-[#243044]">
                What needs your attention?
              </h2>
            </div>

            <span className="rounded-full bg-[#f3ead2] px-3 py-1.5 text-xs font-bold text-[#9a751e]">
              {inventory.alert_count} alert
              {inventory.alert_count === 1 ? "" : "s"}
            </span>

          </div>


          {inventory.alerts.length === 0 ? (

            <div className="rounded-2xl border border-[#3d7a5a]/20 bg-[#e4eee8] p-5">
              <p className="font-bold text-[#3d7a5a]">
                Everything looks healthy.
              </p>

              <p className="mt-1 text-sm text-[#687181]">
                No products are currently running low.
              </p>
            </div>

          ) : (

            <div className="grid gap-3 md:grid-cols-2">

              {inventory.alerts.map((product) => (

                <div
                  key={product.product_id}
                  className="flex items-center justify-between rounded-2xl border border-[#dddcd6] bg-[#fffdfb] p-5 shadow-sm"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2eeee] text-xl">
                      📦
                    </div>

                    <div>
                      <h3 className="font-bold text-[#243044]">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-[#687181]">
                        {product.current_stock} units left
                        {" · "}
                        {product.average_daily_sales} sold/day
                      </p>
                    </div>

                  </div>


                  <div className="text-right">

                    <div className="font-black text-[#c75a46]">
                      {product.days_of_stock} days
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-wide text-[#687181]">
                      stock left
                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* =================================================
            TODAY'S KHATA
        ================================================= */}

        <section className="mt-8">

          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#687181]">
              Recent activity
            </p>

            <h2 className="serif mt-1 text-2xl font-bold text-[#243044]">
              Today's Khata
            </h2>
          </div>


          <div className="overflow-hidden rounded-2xl border border-[#dddcd6] bg-[#fffdfb] shadow-sm">

            {recent_transactions.length === 0 ? (

              <div className="p-6 text-center text-sm text-[#687181]">
                No transactions recorded yet.
              </div>

            ) : (

              recent_transactions.map(
                (transaction, index) => (

                  <div
                    key={transaction.sale_id}
                    className={`flex items-center justify-between gap-4 p-4 ${
                      index !==
                      recent_transactions.length - 1
                        ? "border-b border-[#dddcd6]"
                        : ""
                    }`}
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f3ee] text-sm">
                        🧾
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-bold text-[#243044]">
                          {transaction.product_name}
                        </p>

                        <p className="mt-0.5 text-xs text-[#687181]">
                          {transaction.quantity} unit
                          {transaction.quantity === 1 ? "" : "s"}
                          {" · "}
                          {formatTime(
                            transaction.created_at,
                          )}
                        </p>

                      </div>

                    </div>


                    <div className="shrink-0 text-right">

                      <p className="font-black text-[#243044]">
                        {formatMoney(
                          transaction.total_amount,
                        )}
                      </p>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide ${
                          transaction.payment_mode ===
                          "CASH"
                            ? "text-[#3d7a5a]"
                            : "text-[#c75a46]"
                        }`}
                      >
                        {transaction.payment_mode}
                      </span>

                    </div>

                  </div>

                ),
              )

            )}

          </div>

        </section>


        {/* =================================================
            HISABAI INSIGHT
        ================================================= */}

        <section className="section-ai mt-8 rounded-2xl border border-[#75658f]/15 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#75658f] text-xl text-white">
              ✦
            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#75658f]">
                HisabAI
              </p>

              <h2 className="serif mt-1 text-xl font-bold text-[#243044]">
                A quick look at your shop
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#687181]">
                {inventory.alert_count > 0
                  ? `${inventory.alerts[0].name} has only ${inventory.alerts[0].days_of_stock} days of estimated stock remaining.`
                  : "Your current inventory looks comfortable based on recent sales."
                }
              </p>

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          MOBILE NAV
      ===================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#dddcd6] bg-[#fffdfb]/95 backdrop-blur md:hidden">

        <div className="grid grid-cols-5">

          {[
            ["⌂", "Today"],
            ["▦", "Stock"],
            ["＋", "New bill"],
            ["☷", "Khata"],
            ["✦", "Buy"],
          ].map(([icon, label]) => (

            <button
              key={label}
              className="flex flex-col items-center gap-1 py-3 text-[#687181] transition hover:text-[#243754]"
            >
              <span className="text-lg">
                {icon}
              </span>

              <span className="text-[10px] font-bold">
                {label}
              </span>
            </button>

          ))}

        </div>

      </nav>

    </div>
  )
}

export default App
