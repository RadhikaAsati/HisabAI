
from app.demo_data.shop_data import demo_request
from app.services.purchase_planner import generate_purchase_plan


plan = generate_purchase_plan(demo_request)

print("\n===== HISABAI PURCHASE PLAN =====\n")

for item in plan.recommendations:
    print(
        f"{item.product_name}: {item.status} | "
        f"Quantity: {item.order_quantity} | "
        f"Cost: ₹{item.total_cost:.2f}"
    )
    print(f"Reason: {item.reason}\n")

print("===== FINANCIAL SUMMARY =====")
print(f"Spendable cash: ₹{plan.spendable_cash:.2f}")
print(f"Total purchase cost: ₹{plan.total_purchase_cost:.2f}")
print(
    f"Remaining spendable cash: "
    f"₹{plan.remaining_spendable_cash:.2f}"
)
print(f"Cash after purchase: ₹{plan.cash_after_purchase:.2f}")
print(f"Protected reserve: ₹{plan.protected_reserve:.2f}")