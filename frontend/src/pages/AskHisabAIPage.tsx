import { useState } from "react"
import type { FormEvent } from "react"
import { apiRequest } from "../api/client"

type AskResponse = {
  answer: string
}

const suggestedQuestions = [
  "Mere paas kitna cash hai?",
  "Aaj meri sales kitni hui?",
  "Kaunsa product jaldi khatam hoga?",
  "Mujhe aaj kya purchase karna chahiye?",
]

export default function AskHisabAIPage() {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAsk(event?: FormEvent) {
    event?.preventDefault()

    const trimmedQuestion = question.trim()

    if (!trimmedQuestion) {
      setError("Please enter a question first.")
      return
    }

    setLoading(true)
    setError("")
    setAnswer("")

    try {
      const response = await apiRequest<AskResponse>("/ai/ask", {
        method: "POST",
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      })

      setAnswer(response.answer)
    } catch (err) {
      console.error(err)
      setError(
        "HisabAI could not answer right now. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestion(questionText: string) {
    setQuestion(questionText)
    setAnswer("")
    setError("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#16706e]">
          ASK HISABAI
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-[#123b3b]">
          Ask your shop anything.
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607876]">
          Ask questions about your shop using your actual sales,
          stock and financial data.
        </p>
      </section>

      {/* Main AI Card */}
      <section className="rounded-[28px] border border-[#c9dcda] bg-white p-6 shadow-[0_12px_35px_rgba(18,59,59,0.06)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4d8] text-2xl">
            ✦
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#123b3b]">
              Your digital shop assistant
            </h2>

            <p className="mt-1 text-sm text-[#718583]">
              Ask in English, Hindi or Hinglish. HisabAI will answer
              using your current shop data.
            </p>
          </div>
        </div>

        {/* Question Form */}
        <form onSubmit={handleAsk} className="mt-6">
          <div className="rounded-2xl border border-[#b9ccca] bg-[#f7fbfa] p-2 focus-within:border-[#16706e]">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Mere paas kitna cash hai aur aaj meri sales kitni hui?"
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-[#123b3b] outline-none placeholder:text-[#8aa09e]"
            />

            <div className="flex items-center justify-between gap-3 px-2 pb-1">
              <span className="text-xs text-[#809492]">
                Ask naturally — HisabAI understands Hindi, Hinglish & English.
              </span>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#ef684b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#df5a40] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Thinking..." : "Ask HisabAI →"}
              </button>
            </div>
          </div>
        </form>

        {/* Suggested Questions */}
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#7b908e]">
            TRY ASKING
          </p>

          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                className="rounded-full border border-[#c9dcda] bg-white px-4 py-2 text-sm font-medium text-[#315a58] transition hover:border-[#16706e] hover:bg-[#eef7f5]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <section className="rounded-[24px] border border-[#d8e6e4] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4efff] text-[#7658df]">
              ✦
            </div>

            <div>
              <p className="text-sm font-bold text-[#123b3b]">
                HisabAI is checking your shop...
              </p>

              <p className="mt-1 text-xs text-[#7b908e]">
                Looking at your current business data.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Error */}
      {error && !loading && (
        <section className="rounded-[24px] border border-[#f3c5bb] bg-[#fff5f2] p-5">
          <p className="text-sm font-semibold text-[#b84b35]">
            {error}
          </p>
        </section>
      )}

      {/* Answer */}
      {answer && !loading && (
        <section className="rounded-[24px] border border-[#b9dcd2] bg-[#f4fbf8] p-6 shadow-[0_10px_30px_rgba(53,179,142,0.08)]">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#35b38e] text-lg text-white">
              ✦
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#16706e]">
                HISABAI SAYS
              </p>

              <div className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#244846]">
                {answer}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Small trust note */}
      <p className="px-1 text-xs text-[#829492]">
        HisabAI uses the shop data available in your account to answer
        questions. Financial figures are calculated from your recorded
        business data.
      </p>
    </div>
  )
}