# HisabAI

### Your Shop. Your Numbers. Your Language.

**HisabAI** is a cash-aware AI business companion designed for small shopkeepers who need simple, practical answers from their daily business data.

Small shopkeepers often know their stock, sales, available cash, and customer credit separately, but the difficult question is:

> **"Mere paas ₹5,000 hain. Abhi mujhe kya kharidna chahiye?"**

HisabAI brings these numbers together and helps the shopkeeper decide what to buy, what to postpone, and when to preserve cash.

---

## 🚀 Live Demo

**Web App:**  
https://hisab-ai-coral.vercel.app

**API Documentation:**  
https://hisabai-qbqy.onrender.com/docs

**GitHub:**  
https://github.com/RadhikaAsati/HisabAI

---

## 🔐 Demo Access

Use the following credentials to explore the deployed demo.

**Demo Shop:** Radhika General Store

**Email:** `radhika.demo@example.com`

**Password:** `Radhika@123`

> This is a demo account created specifically for evaluation.
> Please do not change the demo credentials or delete the demo data.

---

## 💡 Problem

Small retail shopkeepers make purchasing decisions using information spread across:

- Current stock
- Daily sales
- Available cash
- Supplier prices
- Supplier lead times
- Customer Udhaar
- Pending payments

Traditional inventory systems often show numbers but do not answer the practical business question:

> **What should I purchase right now without putting my cash at risk?**

HisabAI focuses on this decision.

---

## 🎯 Our Solution

HisabAI combines business data into a simple digital shop workspace.

Its core feature is the:

### 🧠 Cash-Aware Smart Purchase Planner

The planner considers:

- Current inventory
- Average daily sales
- Purchase price
- Supplier lead time
- Available cash
- Cash reserve
- Stock coverage

It then provides practical recommendations such as:

- 🟢 **BUY** — Stock is running low and purchasing is financially feasible.
- 🟡 **POSTPONE** — The product may need replenishment, but purchasing now may put unnecessary pressure on available cash.
- 🔵 **PRESERVE CASH** — Current cash should be protected instead of committing it to additional inventory.
- ⚪ **ENOUGH STOCK** — Existing inventory is sufficient.

The shopkeeper remains in control and can decide whether to act on the recommendation.

---

# ✨ Key Features

## 1. 💰 Cash-Aware Purchase Planner

Helps answer:

> "What should I buy with the cash I have today?"

The planner combines stock movement, purchasing cost, supplier lead time and available cash to generate purchase recommendations.

---

## 2. 📦 Inventory Management

Shopkeepers can:

- View current stock
- Monitor daily sales movement
- View purchase prices
- Track supplier lead times
- Add new products

This provides a single view of the shop's inventory.

---

## 3. 🧾 Smart Billing

Create customer bills with:

- Multiple products
- Quantities
- Selling prices
- CASH payments
- UPI payments
- CREDIT / Udhaar payments

Stock is updated when a sale is recorded.

---

## 4. 📒 Udhaar / Customer Credit

HisabAI provides a digital alternative to maintaining customer credit in a physical notebook.

Shopkeepers can:

- Add customers
- Record Udhaar
- View outstanding balances
- Record customer payments
- Track pending customer payments

---

## 5. 🎤 Voice-Based Sale Entry

Shopkeepers can enter sales using natural language.

For example:

> "Aaj 5 packet Maggi 60 rupees mein beche."

The system extracts the relevant transaction information and allows the shopkeeper to confirm it before recording the sale.

---

## 6. 📷 AI Bill Scanner

Upload a bill or invoice and HisabAI extracts information such as:

- Supplier name
- Invoice number
- Invoice date
- Products
- Quantities
- Prices
- Total amount

The extracted information can then be reviewed and confirmed.

---

## 7. 📊 Profit Watch

Profit Watch provides a simple overview of business profitability using recorded sales and product purchase prices.

It helps identify products that may require attention based on their estimated gross margins.

---

## 8. 🤖 Ask HisabAI

Shopkeepers can ask business questions using natural language.

Examples:

> "Which product should I buy?"

> "How much cash do I have?"

> "Mera kitna udhaar pending hai?"

> "Which products need attention?"

The AI assistant uses the shop's actual business data to answer in a simple, shopkeeper-friendly way.

---

## 9. 📈 Sales History

View recorded sales with information such as:

- Product
- Quantity
- Selling price
- Total amount
- Payment mode
- Transaction date

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Shopkeeper      │
                    │   Web Application    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     React Frontend   │
                    │   TypeScript + UI     │
                    └──────────┬───────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │     FastAPI Backend  │
                    │                      │
                    │  Business Logic      │
                    │  Authentication      │
                    │  Purchase Planner    │
                    │  Billing             │
                    │  Udhaar              │
                    │  AI Services         │
                    └───────┬───────┬──────┘
                            │       │
                  ┌─────────┘       └──────────┐
                  ▼                            ▼
        ┌──────────────────┐         ┌─────────────────┐
        │   PostgreSQL     │         │   Gemini API    │
        │   Business Data  │         │ AI Assistance   │
        └──────────────────┘         └─────────────────┘