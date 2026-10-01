import { useEffect, useState } from "react"
import type { FormEvent } from "react"

import { login, logout } from "./api/auth"
import { getDashboard } from "./api/dashboard"
import type { DashboardResponse } from "./api/dashboard"

type View =
  | "today"
  | "stock"
  | "bill"
  | "khata"
  | "buy"
  | "voice"
  | "scan"
  | "profit"
  | "ask"

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
    <div className="min-h-screen bg-[#eef5f4] text-[#123b3b]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <Sidebar
          view={view}
          setView={setView}
          shopName={dashboard?.shop.shop_name ?? "Your Shop"}
          onLogout={handleLogout}
        />

        {/* MAIN */}
        <main className="min-w-0 flex-1">

          {/* TOP BAR */}
          <TopBar
            shopName={dashboard?.shop.shop_name ?? "Your Shop"}
          />

          {/* CONTENT */}
          <div className="px-5 pb-10 pt-5 sm:px-7 lg:px-9">

            {error && (
              <div className="mb-5 rounded-2xl border border-[#ef6c50]/30 bg-[#fff0eb] px-5 py-3 text-sm text-[#b83c25]">
                {error}
              </div>
            )}

            {view === "today" && (
              <TodayDashboard
                dashboard={dashboard}
                loading={loading}
                setView={setView}
              />
            )}

            {view === "stock" && (
              <StockPage
                dashboard={dashboard}
                loading={loading}
              />
            )}

            {view === "bill" && <ComingSoonPage type="bill" />}

            {view === "khata" && (
              <KhataPage
                dashboard={dashboard}
                loading={loading}
              />
            )}

            {view === "buy" && (
              <PurchasePage
                dashboard={dashboard}
                loading={loading}
              />
            )}

            {view === "voice" && <ComingSoonPage type="voice" />}
            {view === "scan" && <ComingSoonPage type="scan" />}
            {view === "profit" && <ComingSoonPage type="profit" />}
            {view === "ask" && <ComingSoonPage type="ask" />}
          </div>
        </main>
      </div>
    </div>
  )
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  view,
  setView,
  shopName,
  onLogout,
}: {
  view: View
  setView: (view: View) => void
  shopName: string
  onLogout: () => void
}) {
  return (
    <aside className="hidden w-[245px] shrink-0 bg-[#073f40] text-white lg:flex lg:flex-col">

      {/* BRAND */}
      <div className="px-6 pb-5 pt-6">

        <div className="flex items-center gap-2">
          <div className="text-3xl font-black text-[#f59a3d]">
            H
          </div>

          <div className="font-serif text-2xl font-bold">
            Hisab<span className="text-[#f59a3d]">AI</span>
          </div>
        </div>

        <p className="mt-3 truncate text-sm text-white/70">
          {shopName}
        </p>
      </div>

      {/* PRIMARY NAV */}
      <div className="px-4">

        <SidebarItem
          icon="⌂"
          label="Today"
          active={view === "today"}
          onClick={() => setView("today")}
        />

        <SidebarItem
          icon="▣"
          label="Stock"
          active={view === "stock"}
          onClick={() => setView("stock")}
        />

        <SidebarItem
          icon="▤"
          label="New Bill"
          active={view === "bill"}
          onClick={() => setView("bill")}
        />

        <SidebarItem
          icon="♧"
          label="Khata (Udhaar)"
          active={view === "khata"}
          onClick={() => setView("khata")}
        />

        <SidebarItem
          icon="🛒"
          label="Buy (Purchase)"
          active={view === "buy"}
          onClick={() => setView("buy")}
        />
      </div>

      <div className="mx-5 my-5 border-t border-white/20" />

      {/* AI / SMART TOOLS */}
      <div className="px-4">

        <SidebarItem
          icon="♩"
          label="Voice Entry"
          active={view === "voice"}
          onClick={() => setView("voice")}
        />

        <SidebarItem
          icon="▣"
          label="Scan Bill"
          active={view === "scan"}
          onClick={() => setView("scan")}
        />

        <SidebarItem
          icon="⌁"
          label="Profit Watch"
          active={view === "profit"}
          onClick={() => setView("profit")}
        />

        <SidebarItem
          icon="✦"
          label="Ask HisabAI"
          active={view === "ask"}
          onClick={() => setView("ask")}
        />
      </div>

      <div className="mt-auto">

        <div className="mx-5 border-t border-white/20" />

        <button
          onClick={onLogout}
          className="m-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <span>↪</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-2 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#f7ead5] text-[#123b3b] shadow-sm"
          : "text-white/85 hover:bg-white/10"
      }`}
    >
      <span className="w-5 text-center text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

/* =========================================================
   TOP BAR
========================================================= */

function TopBar({
  shopName,
}: {
  shopName: string
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#cfdedc] bg-[#f4f8f7]/95 backdrop-blur">

      <div className="flex min-h-[70px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-9">

        <div>
          <p className="font-serif text-3xl font-bold text-[#123b3b]">
            Today
          </p>

          <p className="mt-0.5 text-xs text-[#6c7e7c]">
            {shopName} · 01 October
          </p>
        </div>

        <div className="hidden items-center gap-3 md:flex">

          <button className="rounded-xl border border-[#b9ccca] bg-white px-4 py-2 text-sm font-semibold">
            🌐 English⌄
          </button>

          <div className="flex w-64 items-center gap-2 rounded-xl border border-[#b9ccca] bg-white px-3 py-2 text-sm text-[#7b8b89]">
            <span>⌕</span>
            <span>Search products, customers...</span>
          </div>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6b96d] bg-[#fff4d8] text-xl">
            ♧
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ed6247]" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c5555] font-bold text-white">
            R
          </div>
        </div>
      </div>
    </header>
  )
}

/* =========================================================
   TODAY DASHBOARD
========================================================= */

function TodayDashboard({
  dashboard,
  loading,
  setView,
}: {
  dashboard: DashboardResponse | null
  loading: boolean
  setView: (view: View) => void
}) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  const { summary, inventory, recent_transactions } = dashboard
  const alert = inventory.alerts[0]

  return (
    <div className="mx-auto max-w-[1450px]">

      {/* HERO / SHOP SCENE */}
      <section className="relative mb-5 min-h-[250px] overflow-hidden rounded-[28px] border border-[#d7dfd9] bg-[#f8e9cf] shadow-sm">

        {/* Decorative shop background */}
        <div className="absolute inset-y-0 right-0 w-[52%] overflow-hidden bg-[#d9e7dc]">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.7),transparent_38%)]" />

          {/* shelves */}
          <div className="absolute right-[5%] top-[20%] h-[58%] w-[75%] rounded-t-[30px] border-8 border-[#185b59] bg-[#d6a45c] shadow-inner" />

          <div className="absolute right-[8%] top-[45%] h-2 w-[69%] bg-[#185b59]" />
          <div className="absolute right-[8%] top-[64%] h-2 w-[69%] bg-[#185b59]" />

          {/* products */}
          <div className="absolute right-[18%] top-[27%] text-5xl">
            🥫 🧃 🛍️
          </div>

          <div className="absolute right-[20%] top-[50%] text-4xl">
            🥛 🍪 🍞
          </div>

          <div className="absolute right-[17%] top-[69%] text-4xl">
            🛒 📦 🥫
          </div>

          {/* counter */}
          <div className="absolute bottom-0 right-0 h-[24%] w-full bg-[#a86d3e]" />

          <div className="absolute bottom-[13%] right-[28%] text-5xl">
            📒
          </div>

          <div className="absolute bottom-[10%] right-[13%] text-4xl">
            ☕
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-[55%] p-7 sm:p-9">

          <p className="mb-2 font-handwriting text-sm font-semibold text-[#50736f]">
            Chalo, aaj ka hisab dekhte hain! :)
          </p>

          <h1 className="font-serif text-4xl font-black leading-[1.02] text-[#123b3b] sm:text-5xl">
            Good morning,
            <br />
            <span className="text-[#e95e42]">Radhika!</span>
          </h1>

          <p className="mt-3 font-serif text-xl font-bold text-[#164c4c]">
            {dashboard.shop.shop_name}
          </p>

          <p className="mt-2 max-w-md text-sm text-[#627572]">
            Keep growing, one smart business decision at a time.
          </p>

          <div className="mt-5 inline-flex rounded-full bg-white/75 px-4 py-2 text-xs font-bold text-[#47706d] shadow-sm">
            ✦ Live shop data
          </div>
        </div>

        {/* Decorative paper */}
        <div className="absolute bottom-5 left-[43%] hidden rotate-[-3deg] bg-[#fff7df] px-4 py-3 text-xs font-semibold text-[#50605d] shadow-md md:block">
          Your shop.
          <br />
          Your numbers.
          <br />
          Your language. ♥
        </div>
      </section>

      {/* KPI ROW */}
      <section className="mb-5 grid gap-4 md:grid-cols-3">

        <KpiCard
          label="Sales Today"
          value={`₹${summary.today_sales.toLocaleString("en-IN")}`}
          tone="orange"
          icon="↗"
        />

        <KpiCard
          label="Cash Available"
          value={`₹${summary.available_cash.toLocaleString("en-IN")}`}
          tone="green"
          icon="₹"
          footer="Available cash"
        />

        <KpiCard
          label="Outstanding Udhaar"
          value={`₹${summary.outstanding_credit.toLocaleString("en-IN")}`}
          tone="yellow"
          icon="♧"
          footer="Customer credit"
        />

      </section>

      {/* MAIN DECISION ROW */}
      <section className="mb-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">

        {/* STOCK ALERT */}
        <StockAlertCard
          alert={alert}
          onReview={() => setView("buy")}
        />

        {/* HISABAI */}
        <HisabAISuggestion
          alert={alert}
          cash={summary.available_cash}
          onAsk={() => setView("ask")}
        />

      </section>

      {/* LOWER ROW */}
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.65fr]">

        {/* TRANSACTIONS */}
        <TransactionsCard transactions={recent_transactions} />

        {/* QUICK ACTIONS */}
        <QuickActions setView={setView} />

        {/* SHOP IN FOCUS */}
        <ShopInFocus />

      </section>
    </div>
  )
}

/* =========================================================
   KPI CARD
========================================================= */

function KpiCard({
  label,
  value,
  tone,
  icon,
  footer,
}: {
  label: string
  value: string
  tone: "orange" | "green" | "yellow"
  icon: string
  footer?: string
}) {
  const styles = {
    orange: {
      bg: "bg-[#fff0ea]",
      border: "border-[#f2b3a4]",
      icon: "bg-[#ef684b] text-white",
      dot: "bg-[#ef684b]",
    },
    green: {
      bg: "bg-[#eaf7f1]",
      border: "border-[#acdccc]",
      icon: "bg-[#35b38e] text-white",
      dot: "bg-[#35b38e]",
    },
    yellow: {
      bg: "bg-[#fff5dc]",
      border: "border-[#ecd08b]",
      icon: "bg-[#f4b632] text-white",
      dot: "bg-[#f4b632]",
    },
  }

  const style = styles[tone]

  return (
    <div
      className={`rounded-2xl border ${style.border} ${style.bg} p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold ${style.icon}`}
          >
            {icon}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#61736f]">
              {label}
            </p>

            {footer && (
              <p className="mt-1 text-xs text-[#80908d]">
                {footer}
              </p>
            )}
          </div>
        </div>

        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
      </div>

      <p className="mt-4 font-serif text-4xl font-black text-[#123b3b]">
        {value}
      </p>

      {tone === "orange" && (
        <p className="mt-2 text-xs font-semibold text-[#6e807d]">
          Today's recorded sales
        </p>
      )}
    </div>
  )
}

/* =========================================================
   STOCK ALERT
========================================================= */

function StockAlertCard({
  alert,
  onReview,
}: {
  alert: DashboardResponse["inventory"]["alerts"][number] | undefined
  onReview: () => void
}) {
  if (!alert) {
    return (
      <div className="rounded-2xl border border-[#b8dfce] bg-[#effaf5] p-7 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#299267]">
          ✓ Stock looks healthy
        </p>

        <h2 className="mt-2 font-serif text-3xl font-black text-[#164c4c]">
          Nothing urgent today.
        </h2>

        <p className="mt-2 text-sm text-[#66817a]">
          No products are currently below the dashboard's stock-alert
          threshold.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#efb6a7] bg-[#fff8f2] shadow-sm">

      <div className="flex items-center justify-between border-b border-[#f1d8cf] px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl text-[#eb5c3e]">⚠</span>

          <p className="font-serif text-lg font-black text-[#d84b30]">
            STOCK NEEDS ATTENTION
          </p>
        </div>

        <span className="rounded-full bg-[#ffe4db] px-3 py-1 text-xs font-bold text-[#d84b30]">
          {alert.name}
        </span>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-[170px_1fr]">

        {/* PRODUCT VISUAL */}
        <div className="flex min-h-[150px] items-center justify-center rounded-2xl bg-[#fbe9d2] text-7xl">
          🍞
        </div>

        <div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-serif text-4xl font-black text-[#123b3b]">
                {alert.name}
              </p>

              <p className="mt-1 text-lg font-bold text-[#e85f42]">
                {alert.current_stock} units left
              </p>
            </div>

            <span className="rounded-full bg-[#ffe0d7] px-3 py-1 text-xs font-bold text-[#d94d32]">
              STOCK LOW
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">

            <MiniMetric
              label="Days of stock"
              value={`${alert.days_of_stock}`}
            />

            <MiniMetric
              label="Daily sales"
              value={`${alert.average_daily_sales}`}
            />

            <MiniMetric
              label="Status"
              value="Review"
            />

          </div>

          <button
            onClick={onReview}
            className="mt-5 rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#dc573d]"
          >
            Review Purchase Plan →
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   HISABAI
========================================================= */

function HisabAISuggestion({
  alert,
  cash,
  onAsk,
}: {
  alert: DashboardResponse["inventory"]["alerts"][number] | undefined
  cash: number
  onAsk: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#d9d1f3] bg-[#f4efff] shadow-sm">

      <div className="flex items-center justify-between border-b border-[#ded7f2] px-6 py-4">

        <div className="flex items-center gap-2">
          <span className="text-2xl text-[#7658df]">✦</span>

          <p className="font-serif text-xl font-black text-[#30245d]">
            HisabAI Suggests
          </p>
        </div>

        <span className="rounded-lg border border-[#c8bde9] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#554779]">
          Hinglish ⌄
        </span>
      </div>

      <div className="p-5">

        <div className="grid gap-4 sm:grid-cols-[100px_1fr]">

          {/* AI CHARACTER / VISUAL */}
          <div className="flex min-h-[130px] items-end justify-center rounded-2xl bg-[#ddd5fb] text-7xl">
            👩🏻‍💼
          </div>

          <div className="relative rounded-2xl bg-white p-5 shadow-sm">

            <span className="absolute -left-2 top-6 h-4 w-4 rotate-45 bg-white" />

            {alert ? (
              <p className="font-handwriting text-lg leading-7 text-[#303044]">
                {alert.name} ka stock{" "}
                <strong>{alert.days_of_stock} din</strong> se bhi kam hai.
                <br />
                Aaj purchase review karna better rahega.
                <br />
                Current cash:{" "}
                <strong>₹{cash.toLocaleString("en-IN")}</strong>.
              </p>
            ) : (
              <p className="font-handwriting text-lg leading-7 text-[#303044]">
                Aaj stock situation healthy hai. Cash aur sales ko dekhte hue
                unnecessary purchase avoid kar sakte hain.
              </p>
            )}
          </div>

        </div>

        <button
          onClick={onAsk}
          className="mt-4 w-full rounded-xl border border-[#bdb0e8] bg-white px-4 py-3 text-sm font-bold text-[#4d3d80] transition hover:bg-[#ebe5ff]"
        >
          Ask HisabAI →
        </button>
      </div>
    </div>
  )
}

/* =========================================================
   TRANSACTIONS
========================================================= */

function TransactionsCard({
  transactions,
}: {
  transactions: DashboardResponse["recent_transactions"]
}) {
  return (
    <div className="rounded-2xl border border-[#cddfdd] bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-[#dfe9e7] px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#71827f]">
            Today's Hisab
          </p>

          <h2 className="font-serif text-2xl font-black text-[#173f3f]">
            Recent transactions
          </h2>
        </div>

        <button className="text-xs font-bold text-[#16706e]">
          View all →
        </button>
      </div>

      <div>
        {transactions.slice(0, 6).map((transaction, index) => (
          <div
            key={`${transaction.sale_id}-${index}`}
            className="grid grid-cols-[50px_1fr_auto] items-center gap-3 border-b border-[#edf1f0] px-5 py-3 last:border-0 sm:grid-cols-[55px_1fr_70px_80px]"
          >
            <span className="text-xs text-[#8a9996]">
              {formatTime(transaction.created_at)}
            </span>

            <div className="flex items-center gap-2">

              <span className="text-xl">
                {transaction.product_name.toLowerCase().includes("bread")
                  ? "🍞"
                  : transaction.product_name.toLowerCase().includes("milk")
                    ? "🥛"
                    : "📦"}
              </span>

              <div>
                <p className="text-sm font-bold text-[#183f3f]">
                  {transaction.product_name}
                </p>

                <p className="text-[11px] text-[#81908d]">
                  {transaction.quantity} unit
                  {transaction.quantity === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <span className="text-right text-sm font-bold">
              ₹{transaction.total_amount.toLocaleString("en-IN")}
            </span>

            <span
              className={`hidden rounded-full px-2 py-1 text-center text-[9px] font-bold uppercase sm:block ${
                transaction.payment_mode === "CREDIT"
                  ? "bg-[#fff0d3] text-[#a16b13]"
                  : "bg-[#e4f7ef] text-[#25835d]"
              }`}
            >
              {transaction.payment_mode}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

function QuickActions({
  setView,
}: {
  setView: (view: View) => void
}) {
  return (
    <div className="rounded-2xl border border-[#cddfdd] bg-white p-5 shadow-sm">

      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#71827f]">
          Shortcuts
        </p>

        <h2 className="font-serif text-2xl font-black text-[#173f3f]">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">

        <ActionTile
          icon="▤"
          title="Create New Bill"
          subtitle="Record a sale"
          tone="orange"
          onClick={() => setView("bill")}
        />

        <ActionTile
          icon="🛒"
          title="Add Purchase"
          subtitle="Buy for your shop"
          tone="green"
          onClick={() => setView("buy")}
        />

        <ActionTile
          icon="♧"
          title="Add Customer"
          subtitle="Track udhaar"
          tone="blue"
          onClick={() => setView("khata")}
        />

        <ActionTile
          icon="✦"
          title="Ask HisabAI"
          subtitle="Business advice"
          tone="purple"
          onClick={() => setView("ask")}
        />

      </div>
    </div>
  )
}

function ActionTile({
  icon,
  title,
  subtitle,
  tone,
  onClick,
}: {
  icon: string
  title: string
  subtitle: string
  tone: "orange" | "green" | "blue" | "purple"
  onClick: () => void
}) {
  const colors = {
    orange: "bg-[#fff0e9] text-[#d9583b]",
    green: "bg-[#e9f7f1] text-[#22825d]",
    blue: "bg-[#edf4ff] text-[#3468bd]",
    purple: "bg-[#f2edff] text-[#7155c9]",
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-4 text-left transition hover:-translate-y-0.5 ${colors[tone]}`}
    >
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-xs font-bold">
        {title}
      </p>

      <p className="mt-1 text-[10px] opacity-70">
        {subtitle}
      </p>
    </button>
  )
}

/* =========================================================
   SHOP IN FOCUS
========================================================= */

function ShopInFocus() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d8cda9] bg-[#fff4d8] p-5 shadow-sm">

      <div className="absolute -right-8 -top-8 text-7xl opacity-20">
        🌿
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a7444]">
        Shop in Focus
      </p>

      <div className="mt-5 rotate-[-2deg] bg-[#fffdf2] p-5 shadow-md">
        <p className="font-handwriting text-xl leading-7 text-[#45514f]">
          Make better
          <br />
          purchase decisions
          <br />
          with your
          <br />
          actual numbers.
          <br />
          <span className="text-[#e46042]">→</span>
        </p>
      </div>

      <div className="mt-4 text-center text-4xl">
        🛍️ 📦
      </div>
    </div>
  )
}

/* =========================================================
   STOCK PAGE
========================================================= */

function StockPage({
  dashboard,
  loading,
}: {
  dashboard: DashboardResponse | null
  loading: boolean
}) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <PageTitle
      eyebrow="Inventory"
      title="Know what's on your shelf."
      description="Your live inventory signals, connected to sales movement."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {dashboard.inventory.alerts.length > 0 ? (
          dashboard.inventory.alerts.map((item) => (
            <div
              key={item.product_id}
              className="rounded-2xl border border-[#efb6a7] bg-[#fff8f2] p-6 shadow-sm"
            >
              <div className="text-6xl">🍞</div>

              <p className="mt-4 font-serif text-3xl font-black">
                {item.name}
              </p>

              <p className="mt-1 text-sm text-[#d95438]">
                {item.current_stock} units remaining
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <MiniMetric
                  label="Days"
                  value={`${item.days_of_stock}`}
                />

                <MiniMetric
                  label="Daily sales"
                  value={`${item.average_daily_sales}`}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[#b8dfce] bg-[#effaf5] p-7">
            <p className="font-serif text-2xl font-black">
              Stock looks healthy.
            </p>
          </div>
        )}

      </div>
    </PageTitle>
  )
}

/* =========================================================
   KHATA
========================================================= */

function KhataPage({
  dashboard,
  loading,
}: {
  dashboard: DashboardResponse | null
  loading: boolean
}) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <PageTitle
      eyebrow="Khata · Udhaar"
      title="Keep the udhaar clear."
      description="Customer credit is part of the same cash picture."
    >
      <div className="rounded-2xl border border-[#ecd08b] bg-[#fff8e6] p-7 shadow-sm">

        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#92713b]">
          Outstanding
        </p>

        <p className="mt-2 font-serif text-5xl font-black">
          ₹{dashboard.summary.outstanding_credit.toLocaleString("en-IN")}
        </p>

        <p className="mt-3 text-sm text-[#77694b]">
          Customer credit currently recorded for this shop.
        </p>

        <button className="mt-6 rounded-xl bg-[#073f40] px-5 py-3 text-sm font-bold text-white">
          Manage Khata →
        </button>
      </div>
    </PageTitle>
  )
}

/* =========================================================
   PURCHASE
========================================================= */

function PurchasePage({
  dashboard,
  loading,
}: {
  dashboard: DashboardResponse | null
  loading: boolean
}) {
  if (loading || !dashboard) {
    return <LoadingState />
  }

  const alert = dashboard.inventory.alerts[0]

  return (
    <PageTitle
      eyebrow="Buy · Purchase Planner"
      title="What should you buy?"
      description="Turn your stock signals and available cash into a purchase decision."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

        <div className="rounded-2xl border border-[#efb6a7] bg-[#fff8f2] p-7 shadow-sm">

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#d95438]">
            Cash-aware purchase planning
          </p>

          <p className="mt-2 font-serif text-5xl font-black">
            ₹{dashboard.summary.available_cash.toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-sm text-[#71817e]">
            Available cash
          </p>

          {alert && (
            <div className="mt-8 border-t border-[#efd8ce] pt-6">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#75817e]">
                    Needs review
                  </p>

                  <h2 className="mt-1 font-serif text-3xl font-black">
                    {alert.name}
                  </h2>
                </div>

                <span className="rounded-full bg-[#ffe0d7] px-3 py-1 text-xs font-bold text-[#d84d31]">
                  BUY REVIEW
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <MiniMetric
                  label="Stock"
                  value={`${alert.current_stock}`}
                />

                <MiniMetric
                  label="Days"
                  value={`${alert.days_of_stock}`}
                />

                <MiniMetric
                  label="Daily sales"
                  value={`${alert.average_daily_sales}`}
                />
              </div>

              <div className="mt-6 rounded-xl bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#7658df]">
                  HisabAI decision engine
                </p>

                <p className="mt-2 text-sm leading-6 text-[#526360]">
                  This product is approaching low stock. The purchase planner
                  will use current stock, sales movement, supplier information
                  and available cash to calculate the recommended quantity.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#073f40] p-7 text-white shadow-sm">

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
            Purchase parchi
          </p>

          <div className="mt-7 space-y-4 border-y border-white/15 py-5">

            <div className="flex justify-between">
              <span className="text-sm text-white/60">
                Cash available
              </span>

              <strong>
                ₹{dashboard.summary.available_cash.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-white/60">
                Current alert
              </span>

              <strong>
                {alert?.name ?? "None"}
              </strong>
            </div>

          </div>

          <button className="mt-7 w-full rounded-xl bg-[#ef684b] px-4 py-3 text-sm font-bold text-white">
            Build Purchase Plan →
          </button>
        </div>
      </div>
    </PageTitle>
  )
}

/* =========================================================
   COMING SOON
========================================================= */

function ComingSoonPage({
  type,
}: {
  type: "bill" | "voice" | "scan" | "profit" | "ask"
}) {
  const content = {
    bill: {
      eyebrow: "New Bill",
      title: "Record a sale.",
      text: "The billing flow will connect products, payments, stock and customer credit.",
      icon: "🧾",
    },
    voice: {
      eyebrow: "Voice Entry",
      title: "Speak your hisab.",
      text: "Voice-based bookkeeping will turn Hindi and Hinglish voice entries into structured business records.",
      icon: "🎙️",
    },
    scan: {
      eyebrow: "Scan Bill",
      title: "Turn a supplier bill into data.",
      text: "The Smart Bill Scanner will extract products, quantities and prices for your review.",
      icon: "📷",
    },
    profit: {
      eyebrow: "Profit Watch",
      title: "Find where money is leaking.",
      text: "Profit Leakage Detector will surface unusual expenses, changing margins and low-profit products.",
      icon: "📉",
    },
    ask: {
      eyebrow: "Ask HisabAI",
      title: "Ask your shop anything.",
      text: "This will become the conversational layer for business questions using your actual shop data.",
      icon: "✦",
    },
  }

  const item = content[type]

  return (
    <PageTitle
      eyebrow={item.eyebrow}
      title={item.title}
      description={item.text}
    >
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-[#cddfdd] bg-white p-10 text-center shadow-sm">

        <div className="text-7xl">
          {item.icon}
        </div>

        <p className="mt-6 rounded-full bg-[#f2edff] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#6d52c5]">
          Building next
        </p>

        <p className="mt-4 max-w-lg text-sm leading-6 text-[#687a76]">
          This area is part of the promised HisabAI workflow. We are building
          it on top of the same real shop data instead of creating disconnected
          demo screens.
        </p>
      </div>
    </PageTitle>
  )
}

/* =========================================================
   SHARED
========================================================= */

function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-[1450px]">

      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#6e817d]">
          {eyebrow}
        </p>

        <h1 className="mt-1 font-serif text-4xl font-black text-[#123b3b]">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71817e]">
          {description}
        </p>
      </div>

      {children}
    </div>
  )
}

function MiniMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#81918e]">
        {label}
      </p>

      <p className="mt-1 font-bold text-[#183f3f]">
        {value}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">

      <div className="text-center">

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#073f40] text-xl text-white">
          H
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-[#71817e]">
          Opening your hisab...
        </p>

      </div>
    </div>
  )
}

function formatTime(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return "--:--"
  }
}

/* =========================================================
   LOGIN
========================================================= */

function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  loading,
  error,
}: {
  email: string
  password: string
  setEmail: (value: string) => void
  setPassword: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  loading: boolean
  error: string
}) {
  return (
    <div className="min-h-screen bg-[#073f40] p-5 sm:p-8">

      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[30px] bg-[#f5f8f6] shadow-2xl">

        <div className="hidden w-1/2 bg-[#073f40] p-10 text-white lg:flex lg:flex-col lg:justify-between">

          <div>
            <div className="font-serif text-3xl font-bold">
              Hisab<span className="text-[#f59a3d]">AI</span>
            </div>

            <p className="mt-3 text-sm text-white/65">
              Your shop. Your numbers. Your language.
            </p>
          </div>

          <div>
            <p className="font-handwriting text-lg text-white/70">
              Chalo, aaj ka hisab dekhte hain! :)
            </p>

            <h1 className="mt-4 font-serif text-6xl font-black leading-none">
              Know your
              <br />
              <span className="text-[#ef684b]">hisab.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-6 text-white/60">
              A cash-aware AI business companion for modern Indian shopkeepers.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 text-sm text-white/70">
            Sales · Stock · Cash · Udhaar · AI
          </div>
        </div>

        <div className="flex flex-1 items-center p-8 sm:p-12">

          <div className="mx-auto w-full max-w-md">

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71817e]">
              Welcome back
            </p>

            <h2 className="mt-2 font-serif text-4xl font-black text-[#123b3b]">
              Open your shop.
            </h2>

            <p className="mt-3 text-sm text-[#71817e]">
              Sign in to continue to your HisabAI workspace.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-[#ef684b]/30 bg-[#fff0ea] px-4 py-3 text-sm text-[#b8452c]">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-8 space-y-5">

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-[#cbdad7] bg-white px-4 py-3 text-sm outline-none focus:border-[#0d6664]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.1em]">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[#cbdad7] bg-white px-4 py-3 text-sm outline-none focus:border-[#0d6664]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-between rounded-xl bg-[#073f40] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#0b5757] disabled:opacity-60"
              >
                <span>{loading ? "Opening..." : "Open HisabAI"}</span>
                <span>→</span>
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App