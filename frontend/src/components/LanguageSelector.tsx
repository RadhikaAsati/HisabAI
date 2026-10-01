import type { Language } from "../i18n/translations"

type LanguageSelectorProps = {
  language: Language
  onChange: (language: Language) => void
}

const options: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "hinglish", label: "Hinglish" },
]

export function LanguageSelector({
  language,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#5b5f66] sm:inline">
        Language
      </span>

      <select
        value={language}
        onChange={(event) => onChange(event.target.value as Language)}
        className="border border-[#1e2a3a]/25 bg-[#f6f1e6] px-3 py-2 text-xs font-bold text-[#1e2a3a] outline-none focus:border-[#a8432a]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
