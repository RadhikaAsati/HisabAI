
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_purchase_plan_api():
    payload = {
        "products": [
            {
                "product_id": 1,
                "name": "Milk",
                "current_stock": 5,
                "average_daily_sales": 10,
                "purchase_price": 50,
                "supplier_lead_time_days": 1
            }
        ],
        "finance": {
            "available_cash": 5000,
            "pending_customer_payments": 8400,
            "cash_reserve": 1000
        }
    }

    response = client.post("/purchase-plan", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert "recommendations" in data
    assert data["total_purchase_cost"] == 1250
    assert data["spendable_cash"] == 4000
    assert data["remaining_spendable_cash"] == 2750
    assert data["cash_after_purchase"] == 3750
    assert data["protected_reserve"] == 1000


def test_partial_purchase_with_limited_budget():
    payload = {
        "products": [
            {
                "product_id": 1,
                "name": "Milk",
                "current_stock": 5,
                "average_daily_sales": 10,
                "purchase_price": 50,
                "supplier_lead_time_days": 1
            },
            {
                "product_id": 2,
                "name": "Bread",
                "current_stock": 2,
                "average_daily_sales": 5,
                "purchase_price": 40,
                "supplier_lead_time_days": 1
            }
        ],
        "finance": {
            "available_cash": 2500,
            "pending_customer_payments": 0,
            "cash_reserve": 1000
        }
    }

    response = client.post("/purchase-plan", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["spendable_cash"] == 1500
    assert data["total_purchase_cost"] == 1470
    assert data["remaining_spendable_cash"] == 30
    assert data["cash_after_purchase"] == 1030
    assert data["protected_reserve"] == 1000

    recommendations = data["recommendations"]

    milk = next(
        item for item in recommendations
        if item["product_name"] == "Milk"
    )

    bread = next(
        item for item in recommendations
        if item["product_name"] == "Bread"
    )

    assert milk["order_quantity"] == 19
    assert milk["total_cost"] == 950

    assert bread["order_quantity"] == 13
    assert bread["total_cost"] == 520    


def test_zero_spendable_cash():
    payload = {
        "products": [
            {
                "product_id": 1,
                "name": "Milk",
                "current_stock": 5,
                "average_daily_sales": 10,
                "purchase_price": 50,
                "supplier_lead_time_days": 1
            }
        ],
        "finance": {
            "available_cash": 1000,
            "pending_customer_payments": 0,
            "cash_reserve": 1000
        }
    }

    response = client.post("/purchase-plan", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["spendable_cash"] == 0
    assert data["total_purchase_cost"] == 0
    assert data["remaining_spendable_cash"] == 0
    assert data["cash_after_purchase"] == 1000
    assert data["protected_reserve"] == 1000
    assert data["recommendations"][0]["status"] == "POSTPONE"


def test_cash_reserve_is_protected():
    payload = {
        "products": [
            {
                "product_id": 1,
                "name": "Milk",
                "current_stock": 5,
                "average_daily_sales": 10,
                "purchase_price": 50,
                "supplier_lead_time_days": 1
            }
        ],
        "finance": {
            "available_cash": 1500,
            "pending_customer_payments": 0,
            "cash_reserve": 1000
        }
    }

    response = client.post("/purchase-plan", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["spendable_cash"] == 500
    assert data["total_purchase_cost"] <= 500
    assert data["cash_after_purchase"] >= 1000
    assert data["protected_reserve"] == 1000