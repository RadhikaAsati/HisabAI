import { useState } from "react"
import type { FormEvent } from "react"
import { login, logout } from "./api/auth"
import { getDashboard, type DashboardResponse } from "./api/dashboard"
import { LanguageSelector } from "./components/LanguageSelector"
import { useLanguage } from "./i18n/useLanguage"

function App() {
  const { language, setLanguage } = useLanguage()

  const [token, setToken] = useState(
    () => localStorage.getItem("hisabai-token"),
  )

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null)

  const [dashboardError, setDashboardError] = useState("")
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)

  async function loadDashboard() {
    setIsLoadingDashboard(true)
    setDashboardError("")

    try {
      const data = await getDashboard()
      setDashboard(data)
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard.",
      )
    } finally {
      setIsLoadingDashboard(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoginError("")
    setIsLoggingIn(true)

    try {
      const response = await login(email, password)

      setToken(response.access_token)

      await loadDashboard()
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your details.",
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  function handleLogout() {
    logout()
    setToken(null)
    setDashboard(null)
    setEmail("")
    setPassword("")
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-[var(--hisab-bg)] px-5 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
          <section className="grid w-full overflow-hidden border border-[var(--hisab-line)] bg-[var(--hisab-surface)] shadow-sm md:grid-cols-2">

            <div className="hidden bg-[var(--hisab-navy)] p-12 text-white md:flex md:flex-col md:justify-between">
              <div>
                <div className="mb-10 text-sm font-bold uppercase tracking-[0.2em]">
                  HisabAI
                </div>

                <h1 className="serif max-w-md text-5xl leading-tight">
                  Your shop.
                  <br />
                  Your numbers.
                  <br />
                  Your language.
                </h1>

                <p className="mt-6 max-w-md text-sm leading-7 text-white/70">
                  A cash-aware business companion built to help small
                  shops understand what is happening and what deserves
                  attention next.
                </p>
              </div>

              <div className="border-l-2 border-[var(--hisab-terracotta)] pl-4 text-sm text-white/70">
                Smart decisions.
                <br />
                Simple numbers.
                <br />
                You stay in control.
              </div>
            </div>

            <div className="p-7 sm:p-10 md:p-12">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hisab-purple)]">
                    Business companion
                  </p>

                  <h2 className="serif mt-2 text-3xl font-bold text-[var(--hisab-ink)]">
                    Welcome back
                  </h2>
                </div>

                <LanguageSelector
                  language={language}
                  onChange={setLanguage}
                />
              </div>

              <p className="mb-8 text-sm leading-6 text-[var(--hisab-muted)]">
                Sign in to open your shop dashboard and continue your
                daily business work.
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-muted)]">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full border border-[var(--hisab-line)] bg-[var(--hisab-surface-soft)] px-4 py-3 text-sm text-[var(--hisab-ink)] outline-none transition focus:border-[var(--hisab-navy)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-muted)]">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full border border-[var(--hisab-line)] bg-[var(--hisab-surface-soft)] px-4 py-3 text-sm text-[var(--hisab-ink)] outline-none transition focus:border-[var(--hisab-navy)]"
                  />
                </div>

                {loginError && (
                  <div className="border-l-4 border-[var(--hisab-terracotta)] bg-[var(--hisab-red-soft)] px-4 py-3 text-sm text-[var(--hisab-terracotta)]">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[var(--hisab-navy)] px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingIn ? "Signing in..." : "Sign in to HisabAI"}
                </button>
              </form>

              <div className="mt-8 border-t border-[var(--hisab-line)] pt-5 text-xs leading-5 text-[var(--hisab-muted)]">
                Your business data stays connected to your shop account.
              </div>
            </div>
          </section>
        </div>
      </main>
    )
  }

  if (isLoadingDashboard && !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--hisab-bg)]">
        <div className="text-center">
          <div className="serif text-3xl font-bold text-[var(--hisab-navy)]">
            HisabAI
          </div>
          <p className="mt-2 text-sm text-[var(--hisab-muted)]">
            Opening your shop...
          </p>
        </div>
      </main>
    )
  }

  if (dashboardError && !dashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--hisab-bg)] px-5">
        <div className="w-full max-w-md border border-[var(--hisab-line)] bg-[var(--hisab-surface)] p-8 text-center shadow-sm">
          <div className="serif text-3xl font-bold text-[var(--hisab-navy)]">
            HisabAI
          </div>

          <p className="mt-4 text-sm text-[var(--hisab-muted)]">
            Something went wrong while opening your dashboard.
          </p>

          <p className="mt-3 break-words text-xs text-[var(--hisab-terracotta)]">
            {dashboardError}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={loadDashboard}
              className="flex-1 bg-[var(--hisab-navy)] px-4 py-3 text-sm font-bold text-white"
            >
              Try again
            </button>

            <button
              onClick={handleLogout}
              className="border border-[var(--hisab-line)] px-4 py-3 text-sm font-bold text-[var(--hisab-ink)]"
            >
              Log out
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!dashboard) {
    return null
  }

  const {
    shop,
    summary,
    inventory,
    recent_transactions,
  } = dashboard

  return (
    <main className="min-h-screen bg-[var(--hisab-bg)] pb-24">
      <header className="bg-[var(--hisab-navy)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div>
            <div className="serif text-2xl font-bold">HisabAI</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/60">
              Your shop. Your numbers.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector
              language={language}
              onChange={setLanguage}
            />

            <button
              onClick={handleLogout}
              className="hidden border border-white/25 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 sm:block"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <section className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hisab-purple)]">
            Good morning
          </p>

          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="serif text-3xl font-bold text-[var(--hisab-ink)] sm:text-4xl">
                {shop.shop_name}
              </h1>

              <p className="mt-1 text-sm text-[var(--hisab-muted)]">
                Here's what needs your attention today.
              </p>
            </div>

            <button
              onClick={loadDashboard}
              className="self-start border border-[var(--hisab-line)] bg-[var(--hisab-surface)] px-4 py-2 text-xs font-bold text-[var(--hisab-ink)]"
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="section-sales border border-[#ead3cd] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-terracotta)]">
              Today's sales
            </p>

            <p className="ledger-number mt-3 text-3xl font-bold text-[var(--hisab-ink)]">
              ₹{summary.today_sales.toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-xs text-[var(--hisab-muted)]">
              Sales recorded today
            </p>
          </div>

          <div className="section-cash border border-[#d5e3da] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-green)]">
              Available cash
            </p>

            <p className="ledger-number mt-3 text-3xl font-bold text-[var(--hisab-ink)]">
              ₹{summary.available_cash.toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-xs text-[var(--hisab-muted)]">
              Cash available for business decisions
            </p>
          </div>

          <div className="section-udhaar border border-[#ead3d0] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-terracotta)]">
              Outstanding udhaar
            </p>

            <p className="ledger-number mt-3 text-3xl font-bold text-[var(--hisab-ink)]">
              ₹{summary.outstanding_credit.toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-xs text-[var(--hisab-muted)]">
              Customer credit still to be collected
            </p>
          </div>
        </section>

        <section className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="section-stock border border-[#d3e4e4] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-teal)]">
                  Inventory attention
                </p>

                <h2 className="serif mt-1 text-2xl font-bold text-[var(--hisab-ink)]">
                  {inventory.alert_count === 0
                    ? "Stock looks healthy"
                    : `${inventory.alert_count} item${
                        inventory.alert_count > 1 ? "s" : ""
                      } need attention`}
                </h2>
              </div>

              <span className="rounded-full bg-[var(--hisab-surface)] px-3 py-1 text-xs font-bold text-[var(--hisab-teal)]">
                {inventory.total_products} products
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {inventory.alerts.length === 0 ? (
                <div className="bg-[var(--hisab-surface)] p-4 text-sm text-[var(--hisab-muted)]">
                  No urgent inventory alerts right now.
                </div>
              ) : (
                inventory.alerts.map((alert) => (
                  <div
                    key={alert.product_id}
                    className="flex items-center justify-between gap-4 border border-[#d8e4e4] bg-[var(--hisab-surface)] p-4"
                  >
                    <div>
                      <p className="font-bold text-[var(--hisab-ink)]">
                        {alert.name}
                      </p>

                      <p className="mt-1 text-xs text-[var(--hisab-muted)]">
                        {alert.current_stock} units left ·{" "}
                        {alert.average_daily_sales} sold/day
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="ledger-number text-lg font-bold text-[var(--hisab-terracotta)]">
                        {alert.days_of_stock} days
                      </p>

                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--hisab-muted)]">
                        stock left
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="section-ai border border-[#ddd7e7] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-purple)]">
              HisabAI insight
            </p>

            <h2 className="serif mt-1 text-2xl font-bold text-[var(--hisab-ink)]">
              Your numbers, made useful.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[var(--hisab-muted)]">
              Bread currently has only{" "}
              <strong className="text-[var(--hisab-ink)]">
                {inventory.alerts[0]?.days_of_stock ?? 0} days
              </strong>{" "}
              of stock based on the current sales rate.
            </p>

            <div className="mt-5 border-l-4 border-[var(--hisab-purple)] bg-[var(--hisab-surface)] px-4 py-3 text-sm leading-6 text-[var(--hisab-ink)]">
              Check the Buy section before placing your next inventory
              order. HisabAI will help balance stock needs with available
              cash.
            </div>
          </div>
        </section>

        <section className="mt-7 border border-[var(--hisab-line)] bg-[var(--hisab-surface)]">
          <div className="border-b border-[var(--hisab-line)] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-muted)]">
              Today's khata
            </p>

            <h2 className="serif mt-1 text-2xl font-bold text-[var(--hisab-ink)]">
              Recent transactions
            </h2>
          </div>

          <div className="divide-y divide-[var(--hisab-line)]">
            {recent_transactions.map((transaction) => (
              <div
                key={transaction.sale_id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div>
                  <p className="font-bold text-[var(--hisab-ink)]">
                    {transaction.product_name}
                  </p>

                  <p className="mt-1 text-xs text-[var(--hisab-muted)]">
                    {transaction.quantity} × ₹
                    {transaction.unit_selling_price.toLocaleString(
                      "en-IN",
                    )}{" "}
                    · {transaction.payment_mode}
                  </p>
                </div>

                <p className="ledger-number font-bold text-[var(--hisab-ink)]">
                  ₹{transaction.total_amount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}

            {recent_transactions.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[var(--hisab-muted)]">
                No transactions yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--hisab-line)] bg-[var(--hisab-surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-around px-2 py-3">
          {["Today", "Stock", "New bill", "Khata", "Buy"].map(
            (item, index) => (
              <button
                key={item}
                className={`px-3 py-2 text-[11px] font-bold ${
                  index === 0
                    ? "text-[var(--hisab-navy)]"
                    : "text-[var(--hisab-muted)]"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </nav>
    </main>
  )
}

export default App
