import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { login, logout } from "./api/auth"
import { getDashboard } from "./api/dashboard"
import type { DashboardResponse } from "./api/dashboard"

type View = "today" | "stock" | "bill" | "khata" | "buy"

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("hisabai-token")
  )

  const [view, setView] = useState<View>("today")

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  async function loadDashboard() {
    setLoading(true)
    setError("")

    try {
      const data = await getDashboard()
      setDashboard(data)
    } catch (err) {
      console.error(err)
      setError("We couldn't load your shop data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadDashboard()
    }
  }, [token])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoginLoading(true)
    setLoginError("")

    try {
      const response = await login(email, password)
      setToken(response.access_token)
    } catch (err) {
      console.error(err)
      setLoginError("Invalid email or password.")
    } finally {
      setLoginLoading(false)
    }
  }

  function handleLogout() {
    logout()
    setToken(null)
    setDashboard(null)
    setView("today")
  }

  if (!token) {
    return (
      <LoginScreen
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        onSubmit={handleLogin}
        loading={loginLoading}
        error={loginError}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--hisab-bg)] text-[var(--hisab-ink)]">
      <div className="mx-auto min-h-screen max-w-6xl px-5 pb-28 pt-5 sm:px-8">

        {/* HEADER */}
        <header className="flex items-start justify-between border-b border-[var(--hisab-line)] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--hisab-ink)] text-sm font-bold text-white">
                H
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--hisab-muted)]">
                  HisabAI
                </p>

                <h1 className="serif text-2xl font-bold tracking-tight">
                  {dashboard?.shop.shop_name ?? "Your Shop"}
                </h1>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--hisab-muted)]">
              Today
            </p>

            <p className="serif text-lg font-bold">
              01 October
            </p>

            <button
              onClick={handleLogout}
              className="mt-1 text-xs font-semibold text-[var(--hisab-muted)] underline underline-offset-4 hover:text-[var(--hisab-ink)]"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mt-5 border border-[var(--hisab-sales)] bg-[var(--hisab-sales-soft)] px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* MAIN CONTENT */}
        {view === "today" && (
          <TodayView
            dashboard={dashboard}
            loading={loading}
            onBuy={() => setView("buy")}
          />
        )}

        {view === "stock" && (
          <StockView
            dashboard={dashboard}
            loading={loading}
          />
        )}

        {view === "bill" && <BillView />}

        {view === "khata" && (
          <KhataView
            dashboard={dashboard}
            loading={loading}
          />
        )}

        {view === "buy" && (
          <BuyView
            dashboard={dashboard}
            loading={loading}
          />
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <BottomNavigation
        view={view}
        setView={setView}
      />
    </div>
  )
}

/* =========================================================
   LOGIN
========================================================= */

type LoginScreenProps = {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  loading: boolean
  error: string
}

function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  loading,
  error,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[var(--hisab-bg)] px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden border border-[var(--hisab-line)] bg-white lg:grid-cols-[1.05fr_0.95fr]">

        {/* LEFT */}
        <div className="relative flex flex-col justify-between bg-[var(--hisab-ink)] p-8 text-white sm:p-12">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-bold text-[var(--hisab-ink)]">
                H
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em]">
                  HisabAI
                </p>

                <p className="text-xs text-white/60">
                  The Cash-Aware AI Business Companion
                </p>
              </div>
            </div>
          </div>

          <div className="my-16 max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Your shop. Your numbers. Your language.
            </p>

            <h1 className="serif text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Know your
              <br />
              <span className="text-[#7C3AED]">hisab.</span>
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-6 text-white/65">
              Make clearer purchase, stock and cash decisions from one simple
              business workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <LoginFeature label="Cash" />
            <LoginFeature label="Stock" />
            <LoginFeature label="Khata" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center p-8 sm:p-12">
          <div className="w-full max-w-md">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--hisab-muted)]">
              Welcome back
            </p>

            <h2 className="serif mt-2 text-4xl font-bold">
              Open your shop.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[var(--hisab-muted)]">
              Sign in to continue to your HisabAI workspace.
            </p>

            {error && (
              <div className="mt-6 border border-[var(--hisab-sales)] bg-[var(--hisab-sales-soft)] px-4 py-3 text-sm text-[var(--hisab-sales)]">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-8 space-y-5">

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border-b-2 border-[var(--hisab-line)] bg-transparent px-1 py-3 text-sm outline-none transition focus:border-[var(--hisab-ink)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em]">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border-b-2 border-[var(--hisab-line)] bg-transparent px-1 py-3 text-sm outline-none transition focus:border-[var(--hisab-ink)]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex w-full items-center justify-between bg-[var(--hisab-ink)] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#263a38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>{loading ? "Opening..." : "Open HisabAI"}</span>
                <span>→</span>
              </button>
            </form>

            <div className="mt-8 border-t border-[var(--hisab-line)] pt-5">
              <p className="text-xs leading-5 text-[var(--hisab-muted)]">
                Demo account available through the credentials already configured
                for your HisabAI project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginFeature({ label }: { label: string }) {
  return (
    <div className="border border-white/15 px-3 py-3">
      <div className="mb-2 h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
      <p className="text-xs font-semibold">{label}</p>
    </div>
  )
}

/* =========================================================
   TODAY
========================================================= */

type DashboardProps = {
  dashboard: DashboardResponse | null
  loading: boolean
}

function TodayView({
  dashboard,
  loading,
  onBuy,
}: DashboardProps & { onBuy: () => void }) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  const { summary, inventory, recent_transactions } = dashboard

  const alert = inventory.alerts[0]

  return (
    <main className="pt-8">

      {/* PAGE INTRO */}
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--hisab-muted)]">
          01 · Today's Bahi
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="serif text-4xl font-bold tracking-tight sm:text-5xl">
              Good morning.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--hisab-muted)]">
              Here is what needs your attention before you start buying for the
              shop.
            </p>
          </div>

          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--hisab-muted)]">
            Live shop data
          </div>
        </div>
      </section>

      {/* TODAY'S NUMBERS */}
      <section className="border-y border-[var(--hisab-line)]">
        <div className="grid md:grid-cols-3">

          <NumberBlock
            label="Sales today"
            value={`₹${summary.today_sales.toLocaleString("en-IN")}`}
            color="sales"
            border
          />

          <NumberBlock
            label="Cash available"
            value={`₹${summary.available_cash.toLocaleString("en-IN")}`}
            color="cash"
            border
          />

          <NumberBlock
            label="Outstanding udhaar"
            value={`₹${summary.outstanding_credit.toLocaleString("en-IN")}`}
            color="warning"
          />

        </div>
      </section>

      {/* ATTENTION */}
      <section className="mt-10">

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--hisab-muted)]">
              What needs your attention
            </p>

            <h3 className="serif mt-1 text-2xl font-bold">
              Before you buy
            </h3>
          </div>

          <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--hisab-sales)]">
            {inventory.alert_count} alert
            {inventory.alert_count === 1 ? "" : "s"}
          </span>
        </div>

        {alert ? (
          <div className="parchi overflow-hidden">

            <div className="grid lg:grid-cols-[1fr_auto]">

              <div className="p-6 sm:p-8">

                <div className="flex items-start gap-4">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[var(--hisab-sales)]" />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--hisab-muted)]">
                      Stock alert
                    </p>

                    <h4 className="serif mt-1 text-4xl font-bold">
                      {alert.name}
                    </h4>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3">

                  <Metric
                    label="Units left"
                    value={String(alert.current_stock)}
                  />

                  <Metric
                    label="Daily sales"
                    value={String(alert.average_daily_sales)}
                  />

                  <Metric
                    label="Days of stock"
                    value={`${alert.days_of_stock}`}
                  />

                </div>
              </div>

              <div className="flex flex-col justify-between border-t border-[var(--hisab-line)] bg-[var(--hisab-sales-soft)] p-6 lg:w-64 lg:border-l lg:border-t-0">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--hisab-sales)]">
                    HisabAI note
                  </p>

                  <p className="mt-3 text-sm leading-6">
                    This item is moving quickly. Check today's purchase before
                    the stock gets low.
                  </p>
                </div>

                <button
                  onClick={onBuy}
                  className="mt-8 flex items-center justify-between border border-[var(--hisab-ink)] bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] transition hover:bg-[var(--hisab-ink)] hover:text-white"
                >
                  Review purchase
                  <span>→</span>
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div className="border border-[var(--hisab-line)] bg-white p-8">
            <p className="serif text-2xl font-bold">
              Nothing urgent today.
            </p>

            <p className="mt-2 text-sm text-[var(--hisab-muted)]">
              Your current stock does not have any critical alerts.
            </p>
          </div>
        )}
      </section>

      {/* HISABAI NOTE */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">

        <div className="section-ai border border-[var(--hisab-line)] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--hisab-ai)]">
            ✎ HisabAI
          </p>

          <h3 className="serif mt-3 text-3xl font-bold">
            Your numbers,
            <br />
            connected.
          </h3>

          <p className="mt-4 text-sm leading-6 text-[var(--hisab-muted)]">
            HisabAI looks across sales, cash, stock and udhaar to help you make
            the next business decision.
          </p>
        </div>

        <div className="border border-[var(--hisab-line)] bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--hisab-muted)]">
            Decision flow
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <FlowStep number="01" text="Your data" />
            <FlowStep number="02" text="What's changing?" />
            <FlowStep number="03" text="What should I do?" />
            <FlowStep number="04" text="Your decision" />
          </div>
        </div>

      </section>

      {/* RECENT HISAB */}
      <section className="mt-10">

        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--hisab-muted)]">
            Recent hisab
          </p>

          <h3 className="serif mt-1 text-2xl font-bold">
            Today's transactions
          </h3>
        </div>

        <div className="border-y border-[var(--hisab-line)] bg-white">

          {recent_transactions.map((transaction, index) => (
            <div
              key={`${transaction.sale_id}-${index}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[var(--hisab-line)] px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_120px_100px]"
            >
              <div>
                <p className="font-semibold">
                  {transaction.product_name}
                </p>

                <p className="mt-1 text-xs text-[var(--hisab-muted)]">
                  {transaction.quantity} unit
                  {transaction.quantity === 1 ? "" : "s"}
                </p>
              </div>

              <p className="ledger-number text-right font-bold">
                ₹{transaction.total_amount.toLocaleString("en-IN")}
              </p>

              <p
                className={`text-right text-[10px] font-bold uppercase tracking-[0.12em] ${
                  transaction.payment_mode === "CREDIT"
                    ? "text-[var(--hisab-warning)]"
                    : "text-[var(--hisab-cash)]"
                }`}
              >
                {transaction.payment_mode}
              </p>
            </div>
          ))}

        </div>
      </section>
    </main>
  )
}

/* =========================================================
   STOCK
========================================================= */

function StockView({ dashboard, loading }: DashboardProps) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <PageShell
      eyebrow="02 · Stock"
      title="Know what's on the shelf."
      description="Your current inventory and the products that need attention."
    >
      <div className="border-y border-[var(--hisab-line)] bg-white">

        {dashboard.inventory.alerts.length > 0 ? (
          dashboard.inventory.alerts.map((item) => (
            <div
              key={item.product_id}
              className="grid gap-4 border-b border-[var(--hisab-line)] px-5 py-6 last:border-b-0 sm:grid-cols-[1fr_140px_140px]"
            >
              <div>
                <p className="serif text-2xl font-bold">
                  {item.name}
                </p>

                <p className="mt-1 text-xs text-[var(--hisab-muted)]">
                  Needs attention
                </p>
              </div>

              <Metric
                label="Units"
                value={String(item.current_stock)}
              />

              <Metric
                label="Days left"
                value={String(item.days_of_stock)}
              />
            </div>
          ))
        ) : (
          <div className="p-8">
            <p className="serif text-2xl font-bold">
              Stock looks healthy.
            </p>
          </div>
        )}

      </div>
    </PageShell>
  )
}

/* =========================================================
   BILL
========================================================= */

function BillView() {
  return (
    <PageShell
      eyebrow="03 · New Bill"
      title="Write a new bill."
      description="Billing will connect sales, stock and customer credit in one flow."
    >
      <div className="parchi p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hisab-muted)]">
          Coming into the workspace
        </p>

        <h3 className="serif mt-3 text-3xl font-bold">
          + New Bill
        </h3>

        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--hisab-muted)]">
          This is where we will build the shopkeeper's fastest billing flow:
          choose products, record payment, reduce stock and create udhaar when
          needed.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <MiniBlock title="Products" text="Choose items" />
          <MiniBlock title="Payment" text="Cash / Credit" />
          <MiniBlock title="Stock" text="Updated automatically" />
        </div>
      </div>
    </PageShell>
  )
}

/* =========================================================
   KHATA
========================================================= */

function KhataView({
  dashboard,
  loading,
}: DashboardProps) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <PageShell
      eyebrow="04 · Khata"
      title="Keep the udhaar clear."
      description="Customer credit belongs in the same business picture as cash."
    >
      <div className="border-y border-[var(--hisab-line)] bg-white">

        <div className="grid gap-5 p-6 sm:grid-cols-3">
          <NumberBlock
            label="Outstanding"
            value={`₹${dashboard.summary.outstanding_credit.toLocaleString("en-IN")}`}
            color="warning"
          />

          <MiniBlock
            title="Customer ledger"
            text="Coming next"
          />

          <MiniBlock
            title="Payments"
            text="Coming next"
          />
        </div>

      </div>
    </PageShell>
  )
}

/* =========================================================
   BUY
========================================================= */

function BuyView({
  dashboard,
  loading,
}: DashboardProps) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  const alert = dashboard.inventory.alerts[0]

  return (
    <PageShell
      eyebrow="05 · Purchase Planner"
      title="What should you buy?"
      description="The cash-aware purchase decision starts here."
    >

      <div className="border-y border-[var(--hisab-line)] bg-white">

        <div className="grid lg:grid-cols-[1fr_320px]">

          <div className="p-6 sm:p-8">

            <div className="flex items-end justify-between border-b border-[var(--hisab-line)] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hisab-muted)]">
                  Available cash
                </p>

                <p className="ledger-number serif mt-1 text-4xl font-bold">
                  ₹{dashboard.summary.available_cash.toLocaleString("en-IN")}
                </p>
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-cash)]">
                Cash-aware
              </p>
            </div>

            {alert ? (
              <div className="mt-8">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hisab-muted)]">
                      Recommended attention
                    </p>

                    <h3 className="serif mt-1 text-3xl font-bold">
                      {alert.name}
                    </h3>
                  </div>

                  <span className="status-buy text-xs font-bold uppercase tracking-[0.12em]">
                    Buy
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 border-y border-[var(--hisab-line)]">
                  <Metric
                    label="Current stock"
                    value={String(alert.current_stock)}
                  />

                  <Metric
                    label="Days left"
                    value={String(alert.days_of_stock)}
                  />

                  <Metric
                    label="Daily sales"
                    value={String(alert.average_daily_sales)}
                  />
                </div>

                <div className="mt-6 section-cash border border-[var(--hisab-line)] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--hisab-cash)]">
                    HisabAI decision
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    This product is approaching low stock. The next step is to
                    calculate how much can be purchased while protecting your
                    working cash.
                  </p>
                </div>

              </div>
            ) : (
              <div className="py-12">
                <p className="serif text-2xl font-bold">
                  No urgent purchases right now.
                </p>
              </div>
            )}

          </div>

          <div className="border-t border-[var(--hisab-line)] bg-[var(--hisab-ink)] p-6 text-white lg:border-l lg:border-t-0 sm:p-8">

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">
              Purchase slip
            </p>

            <div className="mt-8 border-y border-white/15 py-6">

              <div className="flex justify-between gap-4 py-2 text-sm">
                <span className="text-white/60">
                  Cash available
                </span>

                <span className="font-bold">
                  ₹{dashboard.summary.available_cash.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-2 text-sm">
                <span className="text-white/60">
                  Reserve
                </span>

                <span className="font-bold">
                  ₹1,500
                </span>
              </div>

              <div className="mt-3 flex justify-between gap-4 border-t border-white/15 pt-4">
                <span className="font-bold">
                  Spendable
                </span>

                <span className="font-bold text-[#16A34A]">
                  ₹3,500
                </span>
              </div>

            </div>

            <button className="mt-8 w-full bg-white px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--hisab-ink)] transition hover:bg-[#f4f8f7]">
              Build purchase plan →
            </button>

          </div>

        </div>
      </div>
    </PageShell>
  )
}

/* =========================================================
   SHARED COMPONENTS
========================================================= */

function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: import("react").ReactNode
}) {
  return (
    <main className="pt-10">

      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--hisab-muted)]">
          {eyebrow}
        </p>

        <h2 className="serif mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--hisab-muted)]">
          {description}
        </p>
      </section>

      {children}
    </main>
  )
}

function NumberBlock({
  label,
  value,
  color,
  border = false,
}: {
  label: string
  value: string
  color: "sales" | "cash" | "warning"
  border?: boolean
}) {
  const dotClass =
    color === "sales"
      ? "dot-sales"
      : color === "cash"
        ? "dot-cash"
        : "dot-warning"

  return (
    <div
      className={`px-5 py-6 sm:px-7 ${
        border ? "border-b md:border-b-0 md:border-r" : ""
      } border-[var(--hisab-line)]`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />

        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--hisab-muted)]">
          {label}
        </p>
      </div>

      <p className="ledger-number serif mt-3 text-4xl font-bold">
        {value}
      </p>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--hisab-muted)]">
        {label}
      </p>

      <p className="ledger-number mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  )
}

function FlowStep({
  number,
  text,
}: {
  number: string
  text: string
}) {
  return (
    <div className="border border-[var(--hisab-line)] p-4">
      <p className="text-[10px] font-bold tracking-[0.12em] text-[var(--hisab-ai)]">
        {number}
      </p>

      <p className="mt-3 text-xs font-semibold leading-5">
        {text}
      </p>
    </div>
  )
}

function MiniBlock({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="border border-[var(--hisab-line)] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.13em]">
        {title}
      </p>

      <p className="mt-2 text-sm text-[var(--hisab-muted)]">
        {text}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-2 w-2 rounded-full bg-[var(--hisab-ai)]" />

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--hisab-muted)]">
          Opening your hisab...
        </p>
      </div>
    </main>
  )
}

/* =========================================================
   NAVIGATION
========================================================= */

function BottomNavigation({
  view,
  setView,
}: {
  view: View
  setView: (view: View) => void
}) {
  const items: {
    id: View
    label: string
    symbol: string
  }[] = [
    { id: "today", label: "Today", symbol: "01" },
    { id: "stock", label: "Stock", symbol: "02" },
    { id: "bill", label: "+ Bill", symbol: "+" },
    { id: "khata", label: "Khata", symbol: "04" },
    { id: "buy", label: "Buy", symbol: "05" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--hisab-line)] bg-white/95 backdrop-blur">

      <div className="mx-auto flex max-w-6xl items-stretch">

        {items.map((item) => {
          const active = view === item.id

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 transition ${
                active
                  ? "text-[var(--hisab-ink)]"
                  : "text-[var(--hisab-muted)] hover:text-[var(--hisab-ink)]"
              }`}
            >
              {active && (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 bg-[var(--hisab-ai)]" />
              )}

              <span className="text-[9px] font-bold tracking-[0.1em]">
                {item.symbol}
              </span>

              <span className="text-[11px] font-bold">
                {item.label}
              </span>
            </button>
          )
        })}

      </div>
    </nav>
  )
}

export default App