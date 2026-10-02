import { useEffect,useRef, useState } from "react"
import type { FormEvent } from "react"

import { login, logout } from "./api/auth"
import { getDashboard } from "./api/dashboard"
import type { DashboardResponse } from "./api/dashboard"
import { getProducts } from "./api/products"
import type { Product } from "./api/products"
import AskHisabAIPage from "./pages/AskHisabAIPage"
import ProfitWatchPage from "./ProfitWatchPage"
import SalesHistoryPage from "./SalesHistoryPage"

import {
  createPurchasePlan,
} from "./api/purchasePlanner"

import { recordPurchase } from "./api/purchases"
import type {
  PurchasePlanResponse,
} from "./api/purchasePlanner"

import {
  getCustomerBalances,
  type CustomerBalance,
} from "./api/customerBalances"

import {
  getCredits,
  createCreditPayment,
} from "./api/credits"

import { createBill } from "./api/billing"
import { getCustomers } from "./api/customers"
import type { Customer } from "./api/customers"


import {
  extractVoiceEntry,
  confirmVoiceSale,
  type VoiceEntryResponse,
} from "./api/ai"

import {
  scanBill,
  confirmScannedBill,
  type BillScanResponse,
} from "./api/bill"

type Language = "en" | "hi"

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
  | "sales-history"

function App() {
  const [token, setToken] = useState<string | null>(
  localStorage.getItem("hisabai-token")
)
  const [userName, setUserName] = useState<string>(
  localStorage.getItem("hisabai-user-name") || "",
)

  const [view, setView] = useState<View>("today")
  const [language, setLanguage] = useState<Language>("en")

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
      setUserName(response.user.name)
      localStorage.setItem("hisabai-user-name", response.user.name)
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
    setUserName("")
    localStorage.removeItem("hisabai-user-name")
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
          language={language}
        />

        {/* MAIN */}
        <main className="min-w-0 flex-1">

          {/* TOP BAR */}
          <TopBar
            shopName={dashboard?.shop.shop_name ?? "Your Shop"}
            language={language}
            setLanguage={setLanguage}
            userName={userName}
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
                userName={userName}
              />

              
            )}

            {view === "stock" && (
              <StockPage
                dashboard={dashboard}
                loading={loading}
              />
            )}

            {view === "bill" && (
  <BillPage
    dashboard={dashboard}
    loading={loading}
  />
)}

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

            {view === "voice" && <VoiceEntryPage />}
            {view === "scan" && <BillScannerPage />}
            {view === "profit" && <ProfitWatchPage />}
            {view === "ask" && <AskHisabAIPage />}
            {view === "sales-history" && (
  <SalesHistoryPage
    onBack={() => setView("today")}
  />
)}
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
  language,
}: {
  view: View
  setView: (view: View) => void
  shopName: string
  onLogout: () => void
  language: Language
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
          label={language === "hi" ? "आज" : "Today"}
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
          label={language === "hi" ? "नया बिल" : "New Bill"}
          active={view === "bill"}
          onClick={() => setView("bill")}
        />

        <SidebarItem
          icon="♧"
          label={language === "hi" ? "खाता (उधार)" : "Khata (Udhaar)"}
          active={view === "khata"}
          onClick={() => setView("khata")}
        />

        <SidebarItem
          icon="🛒"
          label={language === "hi" ? "खरीदारी" : "Buy (Purchase)"}
          active={view === "buy"}
          onClick={() => setView("buy")}
        />
      </div>

      <div className="mx-5 my-5 border-t border-white/20" />

      {/* AI / SMART TOOLS */}
      <div className="px-4">

        <SidebarItem
          icon="♩"
          label={language === "hi" ? "वॉइस एंट्री" : "Voice Entry"}
          active={view === "voice"}
          onClick={() => setView("voice")}
        />

        <SidebarItem
          icon="▣"
          label={language === "hi" ? "बिल स्कैन करें" : "Scan Bill"}
          active={view === "scan"}
          onClick={() => setView("scan")}
        />

        <SidebarItem
          icon="⌁"
          label={language === "hi" ? "मुनाफ़ा देखें" : "Profit Watch"}
          active={view === "profit"}
          onClick={() => setView("profit")}
        />

        <SidebarItem
          icon="✦"
          label={language === "hi" ? "HisabAI से पूछें" : "Ask HisabAI"}
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
          {language === "hi" ? "साइन आउट" : "Sign out"}
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
  language,
  setLanguage,
  userName,
}: {
  shopName: string
  language: Language
  setLanguage: (language: Language) => void
  userName: string
}) {
    const [searchQuery, setSearchQuery] = useState("")
  return (
    <header className="sticky top-0 z-30 border-b border-[#cfdedc] bg-[#f4f8f7]/95 backdrop-blur">

      <div className="flex min-h-[70px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-9">

        <div>
          <p className="font-serif text-3xl font-bold text-[#123b3b]">
            {language === "hi" ? "आज" : "Today"}
          </p>

          <p className="mt-0.5 text-xs text-[#6c7e7c]">
            {shopName} ·{" "}
  {new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
  })}
          </p>
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">

          <div className="flex w-64 items-center gap-2 rounded-xl border border-[#b9ccca] bg-white px-3 py-2 text-sm text-[#7b8b89]">
  <span>⌕</span>

  <input
    type="text"
    value={searchQuery}
    onChange={(event) => setSearchQuery(event.target.value)}
    placeholder={
      language === "hi"
        ? "उत्पाद, ग्राहक खोजें..."
        : "Search products, customers..."
    }
    className="w-full bg-transparent text-sm text-[#123b3b] outline-none placeholder:text-[#8a9b99]"
  />
</div>

          <select
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value as Language)
            }
            className="h-10 cursor-pointer rounded-xl border border-[#b9ccca] bg-white px-4 text-sm font-semibold text-[#123b3b] outline-none"
            aria-label="Language"
          >
            <option value="en">🌐 English</option>
            <option value="hi">🌐 हिन्दी</option>
          </select>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6b96d] bg-[#fff4d8] text-xl">
            ♧
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ed6247]" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0c5555] font-bold text-white">
            {userName ? userName.charAt(0).toUpperCase() : "?"}
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
  userName,
}: {
  dashboard: DashboardResponse | null
  loading: boolean
  setView: (view: View) => void
  userName: string
}) {
  if (loading || !dashboard) {
    return <LoadingState />
  }
  const currentHour = new Date().getHours()

const greeting =
  currentHour < 5
    ? "Good night,"
    : currentHour < 12
      ? "Good morning,"
      : currentHour < 17
        ? "Good afternoon,"
        : currentHour < 21
          ? "Good evening,"
          : "Good night,"
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
            {greeting}
            <br />
            <span className="text-[#e95e42]">
              {userName || "there"}!
            </span>
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
        <TransactionsCard
  transactions={recent_transactions}
  setView={setView}
/>

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
  setView,
}: {
  transactions: DashboardResponse["recent_transactions"]
  setView: (view: View) => void
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

        <button
        onClick={() => setView("sales-history")} 
        className="text-xs font-bold text-[#16706e]">
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
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
const [showAddProduct, setShowAddProduct] = useState(false)

const [newProduct, setNewProduct] = useState({
  product_id: "",
  name: "",
  current_stock: "",
  average_daily_sales: "",
  purchase_price: "",
  supplier_lead_time_days: "",
})

async function handleAddProduct() {
  try {
    const token = localStorage.getItem("hisabai-token")

    const response = await fetch("http://127.0.0.1:8000/products/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: Number(newProduct.product_id),
        name: newProduct.name,
        current_stock: Number(newProduct.current_stock),
        average_daily_sales: Number(newProduct.average_daily_sales),
        purchase_price: Number(newProduct.purchase_price),
        supplier_lead_time_days: Number(
          newProduct.supplier_lead_time_days
        ),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      alert(error.detail?.[0]?.msg || "Could not add product")
      return
    }

    const created = await response.json()

    setProducts((prev) => [...prev, created])
    setShowAddProduct(false)

    setNewProduct({
      product_id: "",
      name: "",
      current_stock: "",
      average_daily_sales: "",
      purchase_price: "",
      supplier_lead_time_days: "",
    })

    alert("Product added successfully! 🎉")
  } catch (error) {
    console.error(error)
    alert("Something went wrong while adding the product.")
  }
}
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true)

      try {
        const data = await getProducts()
        setProducts(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingProducts(false)
      }
    }

    if (dashboard) {
      loadProducts()
    }
  }, [dashboard])

  if (loading || !dashboard || loadingProducts) {
    return <LoadingState />
  }

  const alertIds = new Set(
    dashboard.inventory.alerts.map((item) => item.product_id)
  )

  function getDaysOfStock(product: Product) {
    if (product.average_daily_sales <= 0) {
      return null
    }

    return product.current_stock / product.average_daily_sales
  }

  function getProductEmoji(name: string) {
    const value = name.toLowerCase()

    if (value.includes("milk")) return "🥛"
    if (value.includes("bread")) return "🍞"
    if (value.includes("biscuit")) return "🍪"
    if (value.includes("maggi") || value.includes("noodle")) return "🍜"

    return "📦"
  }

  return (
    
    <PageTitle
  eyebrow="Inventory"
  title="Know what's on your shelf."
  description="Your live inventory, connected to sales movement."
>
  <button
    onClick={() => setShowAddProduct(true)}
    className="mb-5 rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#dc5a40]"
  >
    + Add Product
  </button>
      {/* INVENTORY SUMMARY */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-[#c8dedd] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#71817e]">
            Products
          </p>

          <p className="mt-2 font-serif text-3xl font-black text-[#173f3f]">
            {products.length}
          </p>

          <p className="mt-1 text-xs text-[#71817e]">
            Products in your shop
          </p>
        </div>

        <div className="rounded-2xl border border-[#efc7bb] bg-[#fff8f2] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#a45b49]">
            Needs attention
          </p>

          <p className="mt-2 font-serif text-3xl font-black text-[#d95438]">
            {dashboard.inventory.alert_count}
          </p>

          <p className="mt-1 text-xs text-[#8c7771]">
            Low-stock products
          </p>
        </div>

        <div className="rounded-2xl border border-[#b9dfcf] bg-[#effaf5] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#4f7d6c]">
            Stock health
          </p>

          <p className="mt-2 font-serif text-3xl font-black text-[#22825d]">
            {products.length - dashboard.inventory.alert_count}
          </p>

          <p className="mt-1 text-xs text-[#71817e]">
            Products without alerts
          </p>
        </div>

      </div>

      {/* ALL PRODUCTS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {products.map((product) => {
          const days = getDaysOfStock(product)
          const needsAttention = alertIds.has(product.product_id)

          return (
            <div
              key={product.product_id}
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 ${
                needsAttention
                  ? "border-[#efb6a7] bg-[#fff8f2]"
                  : "border-[#cfe0dd] bg-white"
              }`}
            >

              <div className="flex items-start justify-between">

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl ${
                    needsAttention
                      ? "bg-[#fde9df]"
                      : "bg-[#eaf5f2]"
                  }`}
                >
                  {getProductEmoji(product.name)}
                </div>

                <span
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                    needsAttention
                      ? "bg-[#ffe0d7] text-[#d95438]"
                      : "bg-[#e4f4ee] text-[#25805e]"
                  }`}
                >
                  {needsAttention ? "Review" : "Healthy"}
                </span>

              </div>

              <p className="mt-5 font-serif text-2xl font-black text-[#173f3f]">
                {product.name}
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  needsAttention
                    ? "text-[#d95438]"
                    : "text-[#4f7d6c]"
                }`}
              >
                {product.current_stock} units remaining
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-[#f4f8f7] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#71817e]">
                    Days of stock
                  </p>

                  <p className="mt-1 text-lg font-black text-[#173f3f]">
                    {days === null ? "—" : days.toFixed(1)}
                  </p>
                </div>

                <div className="rounded-xl bg-[#f4f8f7] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#71817e]">
                    Daily sales
                  </p>

                  <p className="mt-1 text-lg font-black text-[#173f3f]">
                    {product.average_daily_sales}
                  </p>
                </div>

              </div>

              <div className="mt-4 border-t border-[#e2e9e7] pt-4">

                <div className="flex justify-between text-xs">
                  <span className="text-[#71817e]">
                    Purchase price
                  </span>

                  <span className="font-bold text-[#173f3f]">
                    ₹{product.purchase_price}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-[#71817e]">
                    Supplier lead time
                  </span>

                  <span className="font-bold text-[#173f3f]">
                    {product.supplier_lead_time_days} days
                  </span>
                </div>

              </div>

            </div>
          )
        })}

      </div>
      {showAddProduct && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#ef684b]">
            Inventory
          </p>

          <h2 className="font-serif text-2xl font-black text-[#123b3b]">
            Add New Product
          </h2>
        </div>

        <button
          onClick={() => setShowAddProduct(false)}
          className="text-xl text-[#71817e]"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-4">

        {[
          ["product_id", "Product ID", "201"],
          ["name", "Product Name", "Tea"],
          ["current_stock", "Current Stock", "30"],
          ["average_daily_sales", "Average Daily Sales", "5"],
          ["purchase_price", "Purchase Price (₹)", "100"],
          ["supplier_lead_time_days", "Supplier Lead Time (days)", "2"],
        ].map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-bold text-[#355858]">
              {label}
            </label>

            <input
              value={newProduct[key as keyof typeof newProduct]}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  [key]: e.target.value,
                })
              }
              placeholder={placeholder}
              className="w-full rounded-xl border border-[#cfe0dd] px-4 py-3 outline-none focus:border-[#16706e]"
            />
          </div>
        ))}

      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setShowAddProduct(false)}
          className="flex-1 rounded-xl border border-[#cfe0dd] px-4 py-3 font-bold text-[#355858]"
        >
          Cancel
        </button>

        <button
          onClick={handleAddProduct}
          className="flex-1 rounded-xl bg-[#ef684b] px-4 py-3 font-bold text-white"
        >
          Add Product
        </button>
      </div>

    </div>
  </div>
)}
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
  const [customers, setCustomers] = useState<CustomerBalance[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBalance | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH")
  const [savingPayment, setSavingPayment] = useState(false)

  async function loadCustomers() {
    try {
      setLoadingCustomers(true)
      const data = await getCustomerBalances()
      setCustomers(data)
    } catch (error) {
      console.error("Failed to load customer balances:", error)
      alert("Could not load Khata.")
    } finally {
      setLoadingCustomers(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const customersWithBalance = customers.filter(
    (customer) => customer.outstanding_balance > 0,
  )

  const totalOutstanding = customers.reduce(
    (sum, customer) => sum + customer.outstanding_balance,
    0,
  )

  async function handleReceivePayment() {
    if (!selectedCustomer) return

    const amount = Number(paymentAmount)

    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount.")
      return
    }

    if (amount > selectedCustomer.outstanding_balance) {
      alert("Payment cannot be greater than the outstanding balance.")
      return
    }

    try {
      setSavingPayment(true)

      const credits = await getCredits()

      const customerCredits = credits.filter(
        (credit) =>
          credit.customer_id === selectedCustomer.customer_id &&
          credit.amount - (credit.paid_amount ?? 0) > 0,
      )

      if (customerCredits.length === 0) {
        alert("No outstanding credit entry found for this customer.")
        return
      }

      let remainingPayment = amount

      for (const credit of customerCredits) {
        if (remainingPayment <= 0) break

        const outstandingCredit =
          credit.amount - (credit.paid_amount ?? 0)

        const paymentForThisCredit = Math.min(
          remainingPayment,
          outstandingCredit,
        )

        await createCreditPayment({
          credit_id: credit.credit_id,
          amount: paymentForThisCredit,
          payment_method: paymentMethod,
        })

        remainingPayment -= paymentForThisCredit
      }

      alert("Payment received successfully! 💚")
      setSelectedCustomer(null)
      setPaymentAmount("")
      setPaymentMethod("CASH")
      await loadCustomers()
      window.location.reload()
    } catch (error) {
      console.error("Payment error:", error)
      alert("Could not record the payment.")
    } finally {
      setSavingPayment(false)
    }
  }

  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <div className="mx-auto max-w-[1450px] space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-[#073f40] p-7 text-white shadow-sm">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#35b38e]/20" />
        <div className="absolute -bottom-20 right-24 h-36 w-36 rounded-full bg-[#ef684b]/20" />

        <div className="relative">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9ed8c5]">
                Digital Bahi
              </p>
              <h1 className="mt-2 font-serif text-4xl font-black">Khata</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                Customer udhaar, payments and outstanding balances — all in one place.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-right sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">
                Total Outstanding
              </p>
              <p className="mt-1 font-serif text-3xl font-black">
                ₹{totalOutstanding.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full bg-[#fff4d8] px-4 py-2 text-xs font-bold text-[#8d6c24]">
              📒 {customersWithBalance.length} active khata{customersWithBalance.length === 1 ? "" : "s"}
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white/80">
              💰 Receive Cash or UPI
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#ecd08b] bg-[#fff5dc] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#92713b]">Outstanding Udhaar</p>
          <p className="mt-2 font-serif text-3xl font-black text-[#8d6c24]">
            ₹{totalOutstanding.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-[#92713b]">Money customers still owe</p>
        </div>

        <div className="rounded-2xl border border-[#b9dfcf] bg-[#eaf7f1] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#4e816d]">Active Customers</p>
          <p className="mt-2 font-serif text-3xl font-black text-[#217b59]">
            {customersWithBalance.length}
          </p>
          <p className="mt-1 text-xs text-[#5f8578]">Customers with outstanding balance</p>
        </div>

        <div className="rounded-2xl border border-[#c8d9f5] bg-[#edf4ff] p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#5272a7]">Dashboard Udhaar</p>
          <p className="mt-2 font-serif text-3xl font-black text-[#285a9f]">
            ₹{dashboard.summary.outstanding_credit.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-[#607ba2]">Current shop-level credit</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#d9e2df] bg-[#fffdf8] shadow-sm">
        <div className="border-b border-[#e5e1d8] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ef684b]">Customer Ledger</p>
              <h2 className="mt-1 font-serif text-2xl font-black text-[#073f40]">Aaj ka Khata</h2>
              <p className="mt-1 text-xs text-[#7a718f]">Tap a customer to receive their payment.</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-[#7a718f]">Customers</p>
              <p className="font-serif text-2xl font-black text-[#073f40]">{customersWithBalance.length}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loadingCustomers ? (
            <div className="rounded-2xl border border-dashed border-[#d9e2df] bg-white p-10 text-center">
              <div className="text-4xl">📒</div>
              <p className="mt-3 text-sm font-bold text-[#53635f]">Opening today's khata...</p>
            </div>
          ) : customersWithBalance.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9e2df] bg-white p-12 text-center">
              <div className="text-5xl">✨</div>
              <h3 className="mt-4 font-serif text-2xl font-black text-[#073f40]">Khata is clear</h3>
              <p className="mt-2 text-sm text-[#7a718f]">No customer has outstanding udhaar right now.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {customersWithBalance.map((customer) => (
                <div
                  key={customer.customer_id}
                  className="relative overflow-hidden rounded-2xl border border-[#ddd6c8] bg-white p-5 shadow-[0_2px_0_rgba(29,43,42,.04)]"
                >
                  <div className="absolute bottom-0 left-7 top-0 w-px bg-[#ef684b]/25" />
                  <div className="pl-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f5f3] text-xl">👤</div>
                        <div>
                          <h3 className="font-black text-[#073f40]">{customer.name}</h3>
                          {customer.phone && <p className="mt-0.5 text-xs text-[#7a718f]">📞 {customer.phone}</p>}
                        </div>
                      </div>
                      <span className="rounded-full bg-[#fff5dc] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#8d6c24]">UDHAAR</span>
                    </div>

                    <div className="mt-5 rounded-xl bg-[#fffaf0] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b8b69]">Outstanding</p>
                      <p className="mt-1 font-serif text-3xl font-black text-[#8d6c24]">
                        ₹{customer.outstanding_balance.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[11px] text-[#8b858f]">Total Udhaar</p>
                        <p className="mt-1 text-sm font-bold text-[#53635f]">₹{customer.total_credit.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#8b858f]">Paid so far</p>
                        <p className="mt-1 text-sm font-bold text-[#217b59]">₹{customer.total_paid.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setPaymentAmount("")
                        setPaymentMethod("CASH")
                      }}
                      className="mt-5 w-full rounded-xl bg-[#35b38e] px-4 py-3 text-sm font-black text-white transition hover:bg-[#299b78]"
                    >
                      💰 Receive Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#073f40]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[#d9e2df] bg-[#fffdf8] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ef684b]">Payment Entry</p>
                <h2 className="mt-1 font-serif text-2xl font-black text-[#073f40]">Receive Payment</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf3f1] text-[#53635f] transition hover:bg-[#dfe9e7]"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fff5dc] p-4">
              <p className="text-xs font-bold text-[#8d6c24]">Customer</p>
              <p className="mt-1 font-serif text-xl font-black text-[#073f40]">{selectedCustomer.name}</p>
              {selectedCustomer.phone && <p className="mt-1 text-xs text-[#7a718f]">📞 {selectedCustomer.phone}</p>}
              <div className="mt-4 flex items-center justify-between border-t border-[#e7d9b8] pt-3">
                <span className="text-xs text-[#8d7b59]">Outstanding</span>
                <strong className="font-serif text-xl font-black text-[#8d6c24]">
                  ₹{selectedCustomer.outstanding_balance.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#53635f]">Amount Received</label>
              <div className="mt-2 flex items-center rounded-xl border border-[#d9e2df] bg-white px-4 py-3">
                <span className="mr-2 text-lg font-bold text-[#35b38e]">₹</span>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.outstanding_balance}
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-transparent text-lg font-bold outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#8a9996]">
                Maximum: ₹{selectedCustomer.outstanding_balance.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#53635f]">Payment Method</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    paymentMethod === "CASH"
                      ? "border-[#35b38e] bg-[#eaf7f1] text-[#217b59]"
                      : "border-[#d9e2df] bg-white text-[#66716f]"
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    paymentMethod === "UPI"
                      ? "border-[#2563eb] bg-[#edf3ff] text-[#1d4ed8]"
                      : "border-[#d9e2df] bg-white text-[#66716f]"
                  }`}
                >
                  📱 UPI
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={savingPayment || !paymentAmount || Number(paymentAmount) <= 0}
              onClick={handleReceivePayment}
              className="mt-6 w-full rounded-xl bg-[#073f40] px-4 py-4 text-sm font-black text-white transition hover:bg-[#0b5757] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPayment
                ? "Recording Payment..."
                : `Receive ₹${Number(paymentAmount || 0).toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [products, setProducts] = useState<Product[]>([])
  const [plan, setPlan] = useState<PurchasePlanResponse | null>(null)

  const [loadingProducts, setLoadingProducts] = useState(false)
  const [creatingPlan, setCreatingPlan] = useState(false)

  const [error, setError] = useState("")

  // Initial protected cash reserve.
  // We'll make this editable later.
  const cashReserve = 1500

  async function loadProducts() {
    setLoadingProducts(true)
    setError("")

    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError("We couldn't load your products.")
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (dashboard) {
      loadProducts()
    }
  }, [dashboard])

  async function handleCreatePlan() {
    if (!dashboard) {
      return
    }

    setCreatingPlan(true)
    setError("")

    try {
      /*
       * We take the REAL product records returned by the backend
       * and combine them with the REAL financial values from
       * the dashboard.
       */
      const response = await createPurchasePlan({
        products: products.map((product) => ({
          product_id: product.product_id,
          name: product.name,
          current_stock: product.current_stock,
          average_daily_sales: product.average_daily_sales,
          purchase_price: product.purchase_price,
          supplier_lead_time_days: product.supplier_lead_time_days,
        })),

        finance: {
          available_cash: dashboard.summary.available_cash,
          pending_customer_payments:
            dashboard.summary.outstanding_credit,
          cash_reserve: cashReserve,
        },
      })

      setPlan(response)
    } catch (err) {
      console.error(err)
      setError("We couldn't create the purchase plan.")
    } finally {
      setCreatingPlan(false)
    }
  }

  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <PageTitle
      eyebrow="Buy · Purchase Planner"
      title="What should you buy?"
      description="Use your real stock, sales movement and available cash to build today's purchase plan."
    >

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-xl border border-[#ef684b]/30 bg-[#fff0ea] px-5 py-4 text-sm text-[#b8452c]">
          {error}
        </div>
      )}

      {/* FINANCIAL SUMMARY */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">

        <PurchaseMetric
          label="Cash available"
          value={`₹${dashboard.summary.available_cash.toLocaleString("en-IN")}`}
          tone="green"
        />

        <PurchaseMetric
          label="Protected reserve"
          value={`₹${cashReserve.toLocaleString("en-IN")}`}
          tone="yellow"
        />

        <PurchaseMetric
          label="Products loaded"
          value={loadingProducts ? "..." : String(products.length)}
          tone="blue"
        />

      </div>

      {/* CREATE PLAN */}
      {!plan && (
        <div className="overflow-hidden rounded-3xl border border-[#d8cfe9] bg-[#f5f0ff] shadow-sm">

          <div className="grid lg:grid-cols-[1fr_360px]">

            <div className="p-7 sm:p-9">

              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7658df] text-xl text-white">
                  ✦
                </span>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7258bf]">
                    HisabAI Decision Engine
                  </p>

                  <h2 className="font-serif text-3xl font-black text-[#30245d]">
                    Build today's purchase plan
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-[#625b76]">
                HisabAI will look at your current inventory, sales movement,
                purchase prices, supplier lead times and available cash before
                suggesting what to buy.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">

                <PlannerInput
                  label="Products"
                  value={`${products.length} products`}
                  description="Loaded from your shop"
                />

                <PlannerInput
                  label="Available cash"
                  value={`₹${dashboard.summary.available_cash.toLocaleString("en-IN")}`}
                  description="Current shop finance"
                />

                <PlannerInput
                  label="Customer udhaar"
                  value={`₹${dashboard.summary.outstanding_credit.toLocaleString("en-IN")}`}
                  description="Outstanding credit"
                />

                <PlannerInput
                  label="Cash reserve"
                  value={`₹${cashReserve.toLocaleString("en-IN")}`}
                  description="Protected working cash"
                />

              </div>

              <button
                onClick={handleCreatePlan}
                disabled={
                  creatingPlan ||
                  loadingProducts ||
                  products.length === 0
                }
                className="mt-8 rounded-xl bg-[#073f40] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b5757] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingPlan
                  ? "HisabAI is calculating..."
                  : "Build Purchase Plan →"}
              </button>

            </div>

            {/* PURCHASE PARCHI */}
            <div className="relative overflow-hidden bg-[#073f40] p-7 text-white">

              <div className="absolute -right-8 -top-8 text-8xl opacity-10">
                🧾
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">
                Purchase Parchi
              </p>

              <div className="mt-7 border-y border-white/15 py-6">

                <div className="flex justify-between py-2 text-sm">
                  <span className="text-white/60">
                    Cash available
                  </span>

                  <strong>
                    ₹{dashboard.summary.available_cash.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="flex justify-between py-2 text-sm">
                  <span className="text-white/60">
                    Protected reserve
                  </span>

                  <strong>
                    ₹{cashReserve.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="mt-3 flex justify-between border-t border-white/15 pt-4">
                  <span className="font-bold">
                    Spendable before plan
                  </span>

                  <strong className="text-[#6ee7b7]">
                    ₹{Math.max(
                      0,
                      dashboard.summary.available_cash - cashReserve
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>

              </div>

              <p className="mt-6 text-xs leading-5 text-white/55">
                Nothing is purchased automatically. Review the recommendation
                before saving or recording a purchase.
              </p>

            </div>

          </div>
        </div>
      )}

      {/* ACTUAL PLAN */}
      {plan && (
        <PurchasePlanResult
          plan={plan}
          onRebuild={() => setPlan(null)}
        />
      )}

    </PageTitle>
  )
}
function PurchaseMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "green" | "yellow" | "blue"
}) {
  const styles = {
    green: "bg-[#eaf7f1] border-[#b9dfcf] text-[#24845e]",
    yellow: "bg-[#fff5dc] border-[#ecd08b] text-[#956d19]",
    blue: "bg-[#edf4ff] border-[#c6d9f7] text-[#356bbd]",
  }

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${styles[tone]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-75">
        {label}
      </p>

      <p className="mt-2 font-serif text-3xl font-black text-[#123b3b]">
        {value}
      </p>
    </div>
  )
}


function PlannerInput({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-[#d9d1ed] bg-white/75 p-4">

      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#82799b]">
        {label}
      </p>

      <p className="mt-1 font-bold text-[#30245d]">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-[#8a829d]">
        {description}
      </p>

    </div>
  )
}


function PurchasePlanResult({
  plan,
  onRebuild,
}: {
  plan: PurchasePlanResponse
  onRebuild: () => void
}) {
  return (
    <div>

      {/* HEADER */}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7658df]">
            ✦ HisabAI has calculated
          </p>

          <h2 className="mt-1 font-serif text-3xl font-black text-[#123b3b]">
            Today's Purchase Parchi
          </h2>
        </div>

        <button
          onClick={onRebuild}
          className="self-start rounded-xl border border-[#c8d8d5] bg-white px-4 py-2 text-xs font-bold text-[#476562] transition hover:bg-[#f4f8f7]"
        >
          ← Rebuild plan
        </button>

      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <PlanSummary
          label="Total purchase"
          value={`₹${plan.total_purchase_cost.toLocaleString("en-IN")}`}
          tone="orange"
        />

        <PlanSummary
          label="Spendable cash"
          value={`₹${plan.spendable_cash.toLocaleString("en-IN")}`}
          tone="blue"
        />

        <PlanSummary
          label="Remaining spendable"
          value={`₹${plan.remaining_spendable_cash.toLocaleString("en-IN")}`}
          tone="green"
        />

        <PlanSummary
          label="Protected reserve"
          value={`₹${plan.protected_reserve.toLocaleString("en-IN")}`}
          tone="yellow"
        />

      </div>

      {/* RECOMMENDATIONS */}
      <div className="overflow-hidden rounded-3xl border border-[#cddfdd] bg-white shadow-sm">

        <div className="border-b border-[#dfe9e7] bg-[#f8fbfa] px-6 py-5">

          <div className="flex items-center gap-3">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#073f40] text-white">
              ✦
            </span>

            <div>
              <p className="font-serif text-xl font-black text-[#173f3f]">
                Recommendation by product
              </p>

              <p className="text-xs text-[#758582]">
                Review each decision before recording a purchase.
              </p>
            </div>

          </div>

        </div>

        <div>
          {plan.recommendations.map((recommendation) => (
            <RecommendationRow
              key={recommendation.product_id}
              recommendation={recommendation}
            />
          ))}
        </div>

        {/* TOTAL */}
        <div className="border-t-2 border-dashed border-[#cad9d6] bg-[#f8fbfa] px-6 py-6">

          <div className="ml-auto max-w-sm space-y-3">

            <div className="flex justify-between text-sm">
              <span className="text-[#70817e]">
                Total purchase cost
              </span>

              <strong>
                ₹{plan.total_purchase_cost.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[#70817e]">
                Cash after purchase
              </span>

              <strong className="text-[#24845e]">
                ₹{plan.cash_after_purchase.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="flex justify-between border-t border-[#d8e3e0] pt-3">
              <span className="font-bold text-[#173f3f]">
                Protected reserve
              </span>

              <strong className="font-serif text-xl text-[#173f3f]">
                ₹{plan.protected_reserve.toLocaleString("en-IN")}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* APPROVAL */}
      <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#b9dfcf] bg-[#effaf5] p-5 sm:flex-row sm:items-center">

        <div>
          <p className="font-bold text-[#217b59]">
            Review complete?
          </p>

          <p className="mt-1 text-xs text-[#668078]">
            The plan has not changed your inventory or cash yet.
          </p>
        </div>

        <button
  className="rounded-xl bg-[#073f40] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0b5757]"
  onClick={async () => {
    const buyRecommendations = plan.recommendations.filter(
      (recommendation) =>
        recommendation.status.toUpperCase() === "BUY" &&
        recommendation.order_quantity > 0
    )

    if (buyRecommendations.length === 0) {
      alert("There are no products to purchase in this plan.")
      return
    }

    try {
      for (const recommendation of buyRecommendations) {
        await recordPurchase({
          product_id: recommendation.product_id,
          quantity: recommendation.order_quantity,
          unit_purchase_price: recommendation.unit_price,
          payment_status: "PAID",
        })
      }

      alert("Purchase recorded successfully! 📦")
      window.location.reload()

    } catch (error) {
      console.error(error)
      alert("Could not record the purchase.")
    }
  }}
>
  Record Purchase →
</button>
       

      </div>

    </div>
  )
}


function RecommendationRow({
  recommendation,
}: {
  recommendation: PurchasePlanResponse["recommendations"][number]
}) {
  const status = recommendation.status.toUpperCase()

  const isBuy = status === "BUY"

  const statusStyles = isBuy
    ? "bg-[#e5f7ee] text-[#25845e]"
    : status === "POSTPONE"
      ? "bg-[#fff1d5] text-[#9b701d]"
      : "bg-[#e9f5f4] text-[#277b78]"

  const productIcon =
    recommendation.product_name.toLowerCase().includes("bread")
      ? "🍞"
      : recommendation.product_name.toLowerCase().includes("milk")
        ? "🥛"
        : recommendation.product_name.toLowerCase().includes("biscuit")
          ? "🍪"
          : recommendation.product_name.toLowerCase().includes("maggi")
            ? "🍜"
            : "📦"

  return (
    <div className="border-b border-[#e5ecea] px-6 py-6 last:border-b-0">

      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">

        <div>

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f6eee0] text-3xl">
              {productIcon}
            </div>

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="font-serif text-2xl font-black text-[#173f3f]">
                  {recommendation.product_name}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.08em] ${statusStyles}`}
                >
                  {status}
                </span>

              </div>

              <p className="mt-1 text-xs text-[#7b8b88]">
                {recommendation.days_of_stock} days of stock
              </p>

            </div>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">

            <MiniMetric
              label="Order quantity"
              value={String(recommendation.order_quantity)}
            />

            <MiniMetric
              label="Unit price"
              value={`₹${recommendation.unit_price.toLocaleString("en-IN")}`}
            />

            <MiniMetric
              label="Total cost"
              value={`₹${recommendation.total_cost.toLocaleString("en-IN")}`}
            />

            <MiniMetric
              label="Stock"
              value={`${recommendation.days_of_stock} days`}
            />

          </div>

          <div className="mt-5 rounded-xl bg-[#f7f9f8] px-4 py-3">

            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#758582]">
              Why
            </p>

            <p className="mt-1 text-sm leading-6 text-[#53635f]">
              {recommendation.reason}
            </p>

          </div>

        </div>

        <div className="flex items-start justify-start lg:justify-end">

          {isBuy ? (
            <div className="rounded-xl bg-[#eaf7f1] px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5d8575]">
                Recommended
              </p>

              <p className="font-serif text-2xl font-black text-[#21805a]">
                {recommendation.order_quantity}
              </p>

              <p className="text-[10px] font-semibold text-[#6f837c]">
                units
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#fff5dc] px-4 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#99752f]">
                Action
              </p>

              <p className="font-bold text-[#8d6c24]">
                {status}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}


function PlanSummary({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "orange" | "blue" | "green" | "yellow"
}) {
  const styles = {
    orange: "bg-[#fff0ea] border-[#efc0b3]",
    blue: "bg-[#edf4ff] border-[#c6d9f7]",
    green: "bg-[#eaf7f1] border-[#b9dfcf]",
    yellow: "bg-[#fff5dc] border-[#ecd08b]",
  }

  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>

      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#71817e]">
        {label}
      </p>

      <p className="mt-2 font-serif text-3xl font-black text-[#173f3f]">
        {value}
      </p>

    </div>
  )
}
/* =========================================================
  NEW BILL
========================================================= */

type BillCartItem = {
  product: Product
  quantity: number
  unit_selling_price: number
}

function BillPage({
  dashboard,
  loading,
}: {
  dashboard: DashboardResponse | null
  loading: boolean
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<BillCartItem[]>([])

  const [selectedProductId, setSelectedProductId] = useState("")
  const [paymentMode, setPaymentMode] =
    useState<"CASH" |"UPI"| "CREDIT">("CASH")

  const [selectedCustomerId, setSelectedCustomerId] = useState("")

  const [loadingData, setLoadingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadBillData() {
      setLoadingData(true)
      setError("")

      try {
        const [productData, customerData] = await Promise.all([
          getProducts(),
          getCustomers(),
        ])

        setProducts(productData)
        setCustomers(customerData)
      } catch (err) {
        console.error(err)
        setError("We couldn't load your products and customers.")
      } finally {
        setLoadingData(false)
      }
    }

    if (dashboard) {
      loadBillData()
    }
  }, [dashboard])

  function getDefaultSellingPrice(product: Product) {
    const recentSale = dashboard?.recent_transactions.find(
      (transaction) =>
        transaction.product_id === product.product_id
    )

    return recentSale?.unit_selling_price ?? 0
  }

  function addProduct() {
    if (!selectedProductId) {
      return
    }

    const product = products.find(
      (item) =>
        item.product_id === Number(selectedProductId)
    )

    if (!product) {
      return
    }

    const existing = cart.find(
      (item) =>
        item.product.product_id === product.product_id
    )

    if (existing) {
      setCart((current) =>
        current.map((item) =>
          item.product.product_id === product.product_id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  product.current_stock
                ),
              }
            : item
        )
      )
    } else {
      setCart((current) => [
        ...current,
        {
          product,
          quantity: 1,
          unit_selling_price: getDefaultSellingPrice(product),
        },
      ])
    }

    setSelectedProductId("")
  }

  function updateQuantity(productId: number, quantity: number) {
    setCart((current) =>
      current.map((item) =>
        item.product.product_id === productId
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(quantity, item.product.current_stock)
              ),
            }
          : item
      )
    )
  }

  function updatePrice(productId: number, price: number) {
    setCart((current) =>
      current.map((item) =>
        item.product.product_id === productId
          ? {
              ...item,
              unit_selling_price: Math.max(0, price),
            }
          : item
      )
    )
  }

  function removeProduct(productId: number) {
    setCart((current) =>
      current.filter(
        (item) =>
          item.product.product_id !== productId
      )
    )
  }

  const total = cart.reduce(
    (sum, item) =>
      sum +
      item.quantity * item.unit_selling_price,
    0
  )

  async function handleCreateBill() {
    setError("")

    if (cart.length === 0) {
      setError("Add at least one product to the bill.")
      return
    }

    const invalidPrice = cart.some(
      (item) => item.unit_selling_price <= 0
    )

    if (invalidPrice) {
      setError(
        "Please enter a selling price for every product."
      )
      return
    }

    if (
      paymentMode === "CREDIT" &&
      !selectedCustomerId
    ) {
      setError(
        "Select a customer before recording an Udhaar bill."
      )
      return
    }

    setSubmitting(true)

    try {
      await createBill({
        customer_id:
          paymentMode === "CREDIT"
            ? Number(selectedCustomerId)
            : null,

        payment_mode: paymentMode,

        items: cart.map((item) => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
          unit_selling_price:
            item.unit_selling_price,
        })),
      })

      alert("Bill created successfully! 🧾")

      setCart([])
      setSelectedCustomerId("")
      setPaymentMode("CASH")

      await getProducts().then(setProducts)

      window.location.reload()
    } catch (err) {
      console.error(err)
      setError(
        "Could not create the bill. Please check stock and try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !dashboard) {
    return <LoadingState />
  }

  return (
    <PageTitle
      eyebrow="New Bill · Parchi"
      title="Record a sale."
      description="Create a bill from your real products and keep stock and udhaar connected."
    >
      {error && (
        <div className="mb-5 rounded-xl border border-[#ef684b]/30 bg-[#fff0ea] px-5 py-4 text-sm text-[#b8452c]">
          {error}
        </div>
      )}

      {/* BILL WORKSPACE */}
      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">

        {/* LEFT — BILL */}
        <div className="overflow-hidden rounded-3xl border border-[#cddfdd] bg-white shadow-sm">

          {/* HEADER */}
          <div className="border-b border-[#dfe9e7] bg-[#f8fbfa] px-6 py-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#71827f]">
                  Today's Parchi
                </p>

                <h2 className="mt-1 font-serif text-3xl font-black text-[#173f3f]">
                  New Bill
                </h2>
              </div>

              <div className="rounded-xl bg-[#fff4d8] px-4 py-2 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#92713b]">
                  Items
                </p>

                <p className="font-serif text-xl font-black text-[#173f3f]">
                  {cart.length}
                </p>
              </div>

            </div>
          </div>

          {/* ADD PRODUCT */}
          <div className="border-b border-[#e5ecea] p-6">

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#71827f]">
              Add product
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">

              <select
                value={selectedProductId}
                onChange={(event) =>
                  setSelectedProductId(event.target.value)
                }
                disabled={loadingData}
                className="min-h-12 flex-1 rounded-xl border border-[#b9ccca] bg-white px-4 text-sm font-semibold text-[#173f3f] outline-none focus:border-[#0c5555]"
              >
                <option value="">
                  {loadingData
                    ? "Loading products..."
                    : "Select a product"}
                </option>

                {products.map((product) => (
                  <option
                    key={product.product_id}
                    value={product.product_id}
                    disabled={product.current_stock <= 0}
                  >
                    {product.name} · {product.current_stock} in stock
                  </option>
                ))}
              </select>

              <button
                onClick={addProduct}
                disabled={!selectedProductId}
                className="rounded-xl bg-[#ef684b] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#dc573d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add
              </button>

            </div>
          </div>

          {/* CART */}
          <div>

            {cart.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

                <div className="text-6xl">
                  🧾
                </div>

                <h3 className="mt-5 font-serif text-2xl font-black text-[#173f3f]">
                  Your parchi is empty.
                </h3>

                <p className="mt-2 max-w-md text-sm text-[#71817e]">
                  Select products above to start recording
                  today's sale.
                </p>

              </div>
            ) : (
              cart.map((item) => (
                <BillCartRow
                  key={item.product.product_id}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onPriceChange={updatePrice}
                  onRemove={removeProduct}
                />
              ))
            )}

          </div>

          {/* TOTAL */}
          <div className="border-t-2 border-dashed border-[#cbd9d6] bg-[#f8fbfa] px-6 py-6">

            <div className="ml-auto max-w-sm">

              <div className="flex items-center justify-between">
                <span className="text-sm text-[#71827f]">
                  Total bill
                </span>

                <span className="font-serif text-3xl font-black text-[#123b3b]">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT — PAYMENT */}
        <div className="h-fit overflow-hidden rounded-3xl border border-[#d8cfe9] bg-[#f5f0ff] shadow-sm">

          <div className="p-6">

            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7258bf]">
              Payment
            </p>

            <h2 className="mt-1 font-serif text-2xl font-black text-[#30245d]">
              How did they pay?
            </h2>

            {/* CASH / UPI / UDHAAR */}
<div className="mt-5 grid grid-cols-3 gap-3">

  {/* CASH */}
  <button
    onClick={() => {
      setPaymentMode("CASH")
      setSelectedCustomerId("")
    }}
    className={`rounded-xl border px-4 py-4 text-left transition ${
      paymentMode === "CASH"
        ? "border-[#35b38e] bg-[#eaf7f1] text-[#217b59]"
        : "border-[#d9d1ed] bg-white text-[#53635f]"
    }`}
  >
    <div className="text-2xl">
      ₹
    </div>

    <p className="mt-2 text-sm font-bold">
      CASH
    </p>

    <p className="mt-1 text-[11px] opacity-70">
      Paid now
    </p>
  </button>

  {/* UPI */}
  <button
    onClick={() => {
      setPaymentMode("UPI")
      setSelectedCustomerId("")
    }}
    className={`rounded-xl border px-4 py-4 text-left transition ${
      paymentMode === "UPI"
        ? "border-[#2563eb] bg-[#edf3ff] text-[#1d4ed8]"
        : "border-[#d9d1ed] bg-white text-[#53635f]"
    }`}
  >
    <div className="text-2xl">
      📱
    </div>

    <p className="mt-2 text-sm font-bold">
      UPI
    </p>

    <p className="mt-1 text-[11px] opacity-70">
      Paid digitally
    </p>
  </button>

  {/* UDHAAR */}
  <button
    onClick={() => setPaymentMode("CREDIT")}
    className={`rounded-xl border px-4 py-4 text-left transition ${
      paymentMode === "CREDIT"
        ? "border-[#efb95d] bg-[#fff5dc] text-[#8d6c24]"
        : "border-[#d9d1ed] bg-white text-[#53635f]"
    }`}
  >
    <div className="text-2xl">
      ♧
    </div>

    <p className="mt-2 text-sm font-bold">
      UDHAAR
    </p>

    <p className="mt-1 text-[11px] opacity-70">
      Add to Khata
    </p>
  </button>

</div>

            {/* CUSTOMER */}
            {paymentMode === "CREDIT" && (
              <div className="mt-5">

                <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#71827f]">
                  Customer
                </label>

                <select
                  value={selectedCustomerId}
                  onChange={(event) =>
                    setSelectedCustomerId(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-[#b9ccca] bg-white px-4 py-3 text-sm font-semibold text-[#173f3f]"
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.name}
                      {customer.phone
                        ? ` · ${customer.phone}`
                        : ""}
                    </option>
                  ))}
                </select>

              </div>
            )}

            {/* SUMMARY */}
            <div className="mt-6 border-y border-[#d9d1ed] py-5">

              <div className="flex justify-between text-sm">
                <span className="text-[#7a718f]">
                  Items
                </span>

                <strong>
                  {cart.reduce(
                    (sum, item) =>
                      sum + item.quantity,
                    0
                  )}
                </strong>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-[#7a718f]">
                  Payment
                </span>

                <strong>
  {paymentMode === "CASH"
    ? "Cash"
    : paymentMode === "UPI"
      ? "UPI"
      : "Udhaar"}
</strong>
              </div>

              <div className="mt-4 flex justify-between border-t border-[#d9d1ed] pt-4">
                <span className="font-bold text-[#30245d]">
                  Total
                </span>

                <strong className="font-serif text-2xl text-[#173f3f]">
                  ₹{total.toLocaleString("en-IN")}
                </strong>
              </div>

            </div>

            {/* CREATE */}
            <button
              onClick={handleCreateBill}
              disabled={
                submitting ||
                cart.length === 0
              }
              className="mt-6 w-full rounded-xl bg-[#073f40] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#0b5757] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting
                ? "Recording bill..."
                : "Create Bill →"}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#817890]">
              Stock will update automatically after the
              bill is successfully recorded.
            </p>

          </div>
        </div>

      </div>
    </PageTitle>
  )
}


function BillCartRow({
  item,
  onQuantityChange,
  onPriceChange,
  onRemove,
}: {
  item: BillCartItem
  onQuantityChange: (
    productId: number,
    quantity: number
  ) => void
  onPriceChange: (
    productId: number,
    price: number
  ) => void
  onRemove: (productId: number) => void
}) {
  const subtotal =
    item.quantity * item.unit_selling_price

  const icon =
    item.product.name.toLowerCase().includes("bread")
      ? "🍞"
      : item.product.name.toLowerCase().includes("milk")
        ? "🥛"
        : item.product.name.toLowerCase().includes("biscuit")
          ? "🍪"
          : item.product.name.toLowerCase().includes("maggi")
            ? "🍜"
            : "📦"

  return (
    <div className="border-b border-[#e5ecea] px-6 py-5">

      <div className="flex items-start gap-4">

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f6eee0] text-3xl">
          {icon}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-3">

            <div>
              <h3 className="font-serif text-xl font-black text-[#173f3f]">
                {item.product.name}
              </h3>

              <p className="mt-1 text-xs text-[#7b8b88]">
                {item.product.current_stock} units currently in stock
              </p>
            </div>

            <button
              onClick={() =>
                onRemove(item.product.product_id)
              }
              className="text-xs font-bold text-[#d9583b] hover:underline"
            >
              Remove
            </button>

          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">

            {/* QUANTITY */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#71827f]">
                Quantity
              </label>

              <div className="mt-1 flex items-center rounded-xl border border-[#cbd9d6] bg-white">

                <button
                  onClick={() =>
                    onQuantityChange(
                      item.product.product_id,
                      item.quantity - 1
                    )
                  }
                  disabled={item.quantity <= 1}
                  className="px-3 py-2 text-lg disabled:opacity-30"
                >
                  −
                </button>

                <span className="flex-1 text-center text-sm font-bold">
                  {item.quantity}
                </span>

                <button
                  onClick={() =>
                    onQuantityChange(
                      item.product.product_id,
                      item.quantity + 1
                    )
                  }
                  disabled={
                    item.quantity >=
                    item.product.current_stock
                  }
                  className="px-3 py-2 text-lg disabled:opacity-30"
                >
                  +
                </button>

              </div>
            </div>

            {/* PRICE */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#71827f]">
                Selling price
              </label>

              <div className="mt-1 flex items-center rounded-xl border border-[#cbd9d6] bg-white px-3">

                <span className="text-sm text-[#71827f]">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    item.unit_selling_price || ""
                  }
                  onChange={(event) =>
                    onPriceChange(
                      item.product.product_id,
                      Number(event.target.value)
                    )
                  }
                  className="w-full bg-transparent px-2 py-2 text-sm font-bold outline-none"
                />

              </div>
            </div>

            {/* SUBTOTAL */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#71827f]">
                Amount
              </label>

              <p className="mt-2 font-serif text-xl font-black text-[#173f3f]">
                ₹{subtotal.toLocaleString("en-IN")}
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
function VoiceEntryPage() {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState<VoiceEntryResponse | null>(null)
  const [error, setError] = useState("")

  const recognitionRef = useRef<any>(null)

  function startListening() {
    setError("")

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please use Chrome or a supported browser.",
      )
      return
    }

    const recognition = new SpeechRecognition()

    recognition.lang = "en-IN"
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event: any) => {
      let transcript = ""

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript
      }

      setText(transcript)
    }

    recognition.onerror = (event: any) => {
      setListening(false)

      if (event.error === "not-allowed") {
        setError(
          "Microphone permission was blocked. Please allow microphone access and try again.",
        )
      } else {
        setError("Could not capture your voice. Please try again.")
      }
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  async function handleUnderstand() {
    if (!text.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await extractVoiceEntry(text.trim())
      setResult(response)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not understand the entry.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmSale() {
    if (
      !result?.product_match ||
      !result.extraction.quantity ||
      !result.extraction.amount
    ) {
      return
    }

    try {
      setLoading(true)
      setError("")

      await confirmVoiceSale({
        product_id: result.product_match.product_id,
        quantity: Math.round(result.extraction.quantity),
        total_amount: result.extraction.amount,
        payment_mode: "CASH",
      })

      setText("")
      setResult(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not confirm the sale.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-[#ef684b]">
          VOICE ENTRY
        </p>

        <h1 className="mt-1 text-3xl font-bold text-[#073f40]">
          Speak your hisab. 🎙️
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Tell HisabAI what happened in your shop. Speak naturally
          in Hindi, Hinglish, or English and let AI turn your words
          into a structured business entry.
        </p>
      </div>

      {/* Voice input card */}
      <div className="rounded-3xl border border-[#dbe8e6] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-semibold text-[#073f40]">
            What happened today?
          </label>

          <span className="rounded-full bg-[#eef5f4] px-3 py-1 text-xs font-semibold text-[#16706e]">
            Hindi • Hinglish • English
          </span>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Try: "Aaj 5 packet Maggi ₹60 mein beche."'
          rows={5}
          className="mt-3 w-full resize-none rounded-2xl border border-[#d8e5e3] bg-[#f8fbfa] p-4 text-sm outline-none transition focus:border-[#ef684b] focus:ring-2 focus:ring-[#ef684b]/20"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!listening ? (
            <button
              onClick={startListening}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#073f40] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a5051] disabled:cursor-not-allowed disabled:opacity-50"
            >
              🎙️ Start Speaking
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex items-center gap-2 rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e25a3f]"
            >
              ⏹ Stop Listening
            </button>
          )}

          <button
            onClick={handleUnderstand}
            disabled={loading || !text.trim() || listening}
            className="rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e25a3f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Understanding..." : "✨ Understand Entry"}
          </button>

          {listening && (
            <div className="flex items-center gap-2 text-sm font-semibold text-[#ef684b]">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#ef684b]" />
              Listening...
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Speak naturally. HisabAI will understand your entry before
          anything is saved.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* AI result */}
      {result && (
        <div className="rounded-3xl border border-[#dbe8e6] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#16706e]">
                AI understood
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#073f40]">
                Review this entry
              </h2>
            </div>

            <div className="rounded-full bg-[#eaf7f1] px-3 py-1 text-xs font-bold text-[#16706e]">
              {Math.round(result.extraction.confidence * 100)}%
              confidence
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-[#eef5f4] p-4">
              <p className="text-xs text-slate-500">Type</p>
              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.transaction_type}
              </p>
            </div>

            <div className="rounded-2xl bg-[#fff4d8] p-4">
              <p className="text-xs text-slate-500">Product</p>
              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.product_name || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f4efff] p-4">
              <p className="text-xs text-slate-500">Quantity</p>
              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.quantity ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#eaf7f1] p-4">
              <p className="text-xs text-slate-500">Amount</p>
              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.amount != null
                  ? `₹${result.extraction.amount}`
                  : "—"}
              </p>
            </div>
          </div>

          {result.product_match && (
            <div className="mt-5 rounded-2xl border border-[#dbe8e6] bg-[#f8fbfa] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#16706e]">
                Product matched
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#073f40]">
                    {result.product_match.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    Current stock:{" "}
                    <span className="font-semibold">
                      {result.product_match.current_stock}
                    </span>
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#16706e]">
                  Product #{result.product_match.product_id}
                </span>
              </div>
            </div>
          )}

          {result.extraction.transaction_type === "SALE" &&
            result.product_match &&
            result.extraction.quantity &&
            result.extraction.amount && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#073f40] p-5">
                <div className="text-white">
                  <p className="font-bold">
                    Ready to record this sale?
                  </p>

                  <p className="mt-1 text-sm text-white/70">
                    Nothing has been saved yet.
                  </p>
                </div>

                <button
                  onClick={handleConfirmSale}
                  disabled={loading}
                  className="rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e25a3f] disabled:opacity-50"
                >
                  {loading ? "Saving..." : "✓ Confirm Sale"}
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  )
}

function BillScannerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] =
    useState<BillScanResponse | null>(null)
  const [error, setError] = useState("")

  const [paymentMode, setPaymentMode] =
    useState<"CASH" | "UPI" | "CREDIT">("CASH")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    setFile(selectedFile)
    setResult(null)
    setError("")
    setSaved(false)

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreview(objectUrl)
  }

  async function handleScan() {
    if (!file) {
      setError("Please upload a bill image first.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)
    setSaved(false)

    try {
      const response = await scanBill(file)
      setResult(response)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not scan the bill.",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmSave() {
    if (!result) {
      return
    }

    if (!result.extraction.items.length) {
      setError("No bill items were extracted.")
      return
    }

    if (paymentMode === "CREDIT") {
      setError(
        "Credit billing needs an existing customer selection. Please use Cash or UPI for this scanned bill.",
      )
      return
    }

    setSaving(true)
    setError("")

    try {
      const productIds: Record<string, number> = {
        milk: 101,
        bread: 102,
        biscuits: 103,
        maggi: 104,
      }

      const items = result.extraction.items.map((item) => {
        const productId =
          productIds[item.product_name.trim().toLowerCase()]

        if (!productId) {
          throw new Error(
            `Could not match "${item.product_name}" to a shop product.`,
          )
        }

        return {
          product_id: productId,
          quantity: Math.round(item.quantity),
          unit_selling_price: item.unit_price,
        }
      })

      await confirmScannedBill({
        customer_id: null,
        payment_mode: paymentMode,
        items,
      })

      setSaved(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save the scanned bill.",
      )
    } finally {
      setSaving(false)
    }
  }

  function handleRemove() {
    setFile(null)
    setPreview("")
    setResult(null)
    setError("")
    setSaved(false)
    setPaymentMode("CASH")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-[#ef684b]">
          SMART BILL SCANNER
        </p>

        <h1 className="mt-1 text-3xl font-bold text-[#073f40]">
          Turn bills into clean data. 🧾
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Upload a shop bill and let HisabAI extract the useful
          details automatically. Review everything before it is
          saved.
        </p>
      </div>

      {/* Upload + Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload */}
        <div className="rounded-3xl border border-[#dbe8e6] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#16706e]">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#073f40]">
                Upload your bill
              </h2>
            </div>

            <div className="rounded-full bg-[#fff4d8] px-3 py-1 text-xs font-bold text-[#a36b00]">
              AI Vision
            </div>
          </div>

          <label className="mt-5 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cbdedb] bg-[#f8fbfa] p-6 text-center transition hover:border-[#ef684b] hover:bg-[#fffaf8]">
            <div className="text-4xl">📸</div>

            <p className="mt-3 font-bold text-[#073f40]">
              Choose a bill image
            </p>

            <p className="mt-1 text-xs text-slate-500">
              JPG, JPEG, PNG or other supported image formats
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#eef5f4] p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#073f40]">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <button
                onClick={handleRemove}
                className="ml-4 rounded-lg px-3 py-2 text-xs font-bold text-[#ef684b] hover:bg-white"
              >
                Remove
              </button>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!file || loading}
            className="mt-5 w-full rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e25a3f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "🔍 Scanning with AI..."
              : "✨ Scan Bill"}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            Nothing is saved until you review and confirm.
          </p>
        </div>

        {/* Preview */}
        <div className="rounded-3xl border border-[#dbe8e6] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-[#16706e]">
            Preview
          </p>

          <h2 className="mt-1 text-xl font-bold text-[#073f40]">
            Your uploaded bill
          </h2>

          {preview ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#dbe8e6] bg-[#f8fbfa]">
              <img
                src={preview}
                alt="Uploaded bill preview"
                className="max-h-96 w-full object-contain"
              />
            </div>
          ) : (
            <div className="mt-5 flex min-h-56 items-center justify-center rounded-2xl bg-[#f8fbfa] text-center">
              <div>
                <div className="text-4xl">🧾</div>

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Your bill preview will appear here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {saved && (
        <div className="rounded-2xl border border-[#acdccc] bg-[#eaf7f1] p-5">
          <p className="font-bold text-[#217b59]">
            ✓ Bill saved successfully!
          </p>

          <p className="mt-1 text-sm text-[#4f7d6c]">
            The sale has been recorded and inventory has been
            updated.
          </p>
        </div>
      )}

      {/* AI Result */}
      {result && (
        <div className="rounded-3xl border border-[#dbe8e6] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#16706e]">
                AI understood
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#073f40]">
                Review extracted bill
              </h2>
            </div>

            <div className="rounded-full bg-[#eaf7f1] px-4 py-2 text-xs font-bold text-[#16706e]">
              {Math.round(
                result.extraction.confidence * 100,
              )}
              % confidence
            </div>
          </div>

          {/* Bill details */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-[#eef5f4] p-4">
              <p className="text-xs text-slate-500">
                Customer
              </p>

              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.customer_name || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#fff4d8] p-4">
              <p className="text-xs text-slate-500">
                Supplier
              </p>

              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.supplier_name || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f4efff] p-4">
              <p className="text-xs text-slate-500">
                Invoice
              </p>

              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.invoice_number || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#eaf7f1] p-4">
              <p className="text-xs text-slate-500">
                Grand Total
              </p>

              <p className="mt-1 text-lg font-bold text-[#073f40]">
                {result.extraction.grand_total != null
                  ? `₹${result.extraction.grand_total}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Extracted items */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#dbe8e6]">
            <div className="bg-[#073f40] px-4 py-3 text-sm font-bold text-white">
              Extracted Items
            </div>

            <div className="divide-y divide-[#e5eeee]">
              {result.extraction.items.map(
                (item, index) => (
                  <div
                    key={`${item.product_name}-${index}`}
                    className="grid gap-3 px-4 py-4 sm:grid-cols-4"
                  >
                    <div>
                      <p className="text-xs text-slate-500">
                        Product
                      </p>

                      <p className="font-bold text-[#073f40]">
                        {item.product_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Quantity
                      </p>

                      <p className="font-semibold text-[#073f40]">
                        {item.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Unit Price
                      </p>

                      <p className="font-semibold text-[#073f40]">
                        ₹{item.unit_price}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Line Total
                      </p>

                      <p className="font-semibold text-[#073f40]">
                        ₹{item.total_amount}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Payment mode */}
          <div className="mt-6 rounded-2xl border border-[#dbe8e6] bg-[#f8fbfa] p-4">
            <p className="text-sm font-bold text-[#073f40]">
              How was this bill paid?
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {(["CASH", "UPI", "CREDIT"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPaymentMode(mode)
                      setError("")
                    }}
                    className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                      paymentMode === mode
                        ? "bg-[#073f40] text-white"
                        : "border border-[#d8e5e3] bg-white text-[#073f40] hover:border-[#ef684b]"
                    }`}
                  >
                    {mode === "CASH"
                      ? "💵 Cash"
                      : mode === "UPI"
                        ? "📱 UPI"
                        : "📒 Credit"}
                  </button>
                ),
              )}
            </div>

            {paymentMode === "CREDIT" && (
              <p className="mt-3 text-xs font-semibold text-[#a36b00]">
                Credit requires selecting an existing customer.
                For this scanner version, use Cash or UPI.
              </p>
            )}
          </div>

          {/* Confirmation */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#073f40] p-5">
            <div className="text-white">
              <p className="font-bold">
                Review complete?
              </p>

              <p className="mt-1 text-sm text-white/70">
                Confirm only after checking the extracted details.
              </p>
            </div>

            <button
              onClick={handleConfirmSave}
              disabled={saving || saved || paymentMode === "CREDIT"}
              className="rounded-xl bg-[#ef684b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#e25a3f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saved
                ? "✓ Saved Successfully"
                : saving
                  ? "Saving..."
                  : "✓ Confirm & Save"}
            </button>
          </div>
        </div>
      )}
    </div>
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