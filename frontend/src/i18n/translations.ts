export type Language = "en" | "hi" | "hinglish"

export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  hinglish: "Hinglish",
}

export const translations = {
  en: {
    brandTagline: "Your shop. Your numbers. Your language.",
    today: "Today",
    storeOwner: "Owner",

    navigation: {
      overview: "Overview",
      newBill: "New Bill",
      inventory: "Inventory",
      khata: "Khata",
      cashFlow: "Cash Flow",
      purchasePlanner: "Purchase Planner",
      assistant: "HisabAI Assistant",
    },

    dashboard: {
      greeting: "Good afternoon",
      title: "Today's Overview",
      subtitle: "Your shop at a glance.",
      newBill: "New Bill",

      todaySales: "Today's Sales",
      cashAvailable: "Cash Available",
      outstandingUdhaar: "Outstanding Udhaar",
      customersOwe: "customers owe you",

      attention: "Needs Your Attention",
      items: "items",

      purchase: "Purchase Recommendation",
      whatToBuy: "What to buy next",
      viewPlan: "View purchase plan",

      transactions: "Recent Transactions",
      viewAll: "View all",

      ask: "Ask HisabAI",
      noticed: "I noticed",
      suggestion: "My suggestion",

      milkNote:
        "Milk is moving faster than usual. You have around 3 days of stock left.",
      reserve: "reserve protected",
    },

    actions: {
      checkStock: "Check stock",
      openKhata: "Open khata",
      viewProduct: "View product",
      buy: "BUY",
      cash: "CASH",
      credit: "UDHAAR",
      priority: "PRIORITY",
    },

    language: {
      label: "Language",
      choose: "Choose your language",
    },
  },

  hi: {
    brandTagline: "आपकी दुकान। आपके हिसाब। आपकी भाषा।",
    today: "आज",
    storeOwner: "मालिक",

    navigation: {
      overview: "डैशबोर्ड",
      newBill: "नया बिल",
      inventory: "स्टॉक",
      khata: "खाता",
      cashFlow: "कैश फ्लो",
      purchasePlanner: "खरीद योजना",
      assistant: "HisabAI सहायक",
    },

    dashboard: {
      greeting: "नमस्ते",
      title: "आज का हिसाब",
      subtitle: "आपकी दुकान का एक नज़र में हिसाब।",
      newBill: "नया बिल",

      todaySales: "आज की बिक्री",
      cashAvailable: "उपलब्ध नकद",
      outstandingUdhaar: "बकाया उधार",
      customersOwe: "ग्राहकों का बाकी",

      attention: "ध्यान दें",
      items: "चीज़ें",

      purchase: "खरीद सुझाव",
      whatToBuy: "अगली खरीदारी",
      viewPlan: "खरीद योजना देखें",

      transactions: "हाल की एंट्री",
      viewAll: "सब देखें",

      ask: "HisabAI से पूछें",
      noticed: "ध्यान दिया",
      suggestion: "मेरा सुझाव",

      milkNote:
        "दूध सामान्य से तेज़ बिक रहा है। आपके पास लगभग 3 दिन का स्टॉक बचा है।",
      reserve: "रिज़र्व सुरक्षित है",
    },

    actions: {
      checkStock: "स्टॉक देखें",
      openKhata: "खाता खोलें",
      viewProduct: "प्रोडक्ट देखें",
      buy: "खरीदें",
      cash: "नकद",
      credit: "उधार",
      priority: "ज़रूरी",
    },

    language: {
      label: "भाषा",
      choose: "अपनी भाषा चुनें",
    },
  },

  hinglish: {
    brandTagline: "Aapki shop. Aapke numbers. Aapki language.",
    today: "Aaj",
    storeOwner: "Owner",

    navigation: {
      overview: "Overview",
      newBill: "Naya Bill",
      inventory: "Stock",
      khata: "Khata",
      cashFlow: "Cash Flow",
      purchasePlanner: "Kharid Planner",
      assistant: "HisabAI Assistant",
    },

    dashboard: {
      greeting: "Good afternoon",
      title: "Aaj ka Hisaab",
      subtitle: "Aapki shop ka ek glance mein hisaab.",
      newBill: "Naya Bill",

      todaySales: "Aaj ki Sales",
      cashAvailable: "Available Cash",
      outstandingUdhaar: "Baaki Udhaar",
      customersOwe: "customers ka baaki",

      attention: "Dhyaan Do",
      items: "items",

      purchase: "Kharid Suggestion",
      whatToBuy: "Ab kya kharidna hai",
      viewPlan: "Purchase plan dekho",

      transactions: "Recent Transactions",
      viewAll: "Sab dekho",

      ask: "HisabAI se Poochho",
      noticed: "Maine notice kiya",
      suggestion: "Mera suggestion",

      milkNote:
        "Milk normal se fast bik raha hai. Aapke paas around 3 days ka stock bacha hai.",
      reserve: "reserve protected hai",
    },

    actions: {
      checkStock: "Stock dekho",
      openKhata: "Khata kholo",
      viewProduct: "Product dekho",
      buy: "KHARIDO",
      cash: "CASH",
      credit: "UDHAAR",
      priority: "PRIORITY",
    },

    language: {
      label: "Language",
      choose: "Apni language choose karein",
    },
  },
} as const
