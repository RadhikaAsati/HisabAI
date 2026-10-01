import { useEffect, useState } from "react"
import {
  languageNames,
  translations,
} from "./translations"
import type { Language } from "./translations"

const STORAGE_KEY = "hisabai-language"

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved === "en" || saved === "hi" || saved === "hinglish") {
      return saved
    }

    return "en"
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
  }

  return {
    language,
    setLanguage,
    languageNames,
    t: translations[language],
  }
}
