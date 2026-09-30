from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_sale_and_reduce_stock():
    # Get an existing product
    products_response = client.get("/products/")
    assert products_response.status_code == 200

    products = products_response.json()
    assert len(products) > 0

    product = products[0]
    product_id = product["product_id"]
    initial_stock = product["current_stock"]

    # Record a sale
    response = client.post(
        "/sales/",
        json={
            "product_id": product_id,
            "quantity": 1,
            "unit_selling_price": 100,
            "payment_mode": "CASH",
        },
    )

    assert response.status_code == 200

    sale = response.json()

    assert sale["product_id"] == product_id
    assert sale["quantity"] == 1
    assert sale["unit_selling_price"] == 100
    assert sale["total_amount"] == 100
    assert sale["payment_mode"] == "CASH"

    # Verify stock decreased
    products_after = client.get("/products/").json()
    updated_product = next(
        p for p in products_after
        if p["product_id"] == product_id
    )

    assert updated_product["current_stock"] == initial_stock - 1


def test_sale_fails_when_stock_is_insufficient():
    products_response = client.get("/products/")
    assert products_response.status_code == 200

    product = products_response.json()[0]

    response = client.post(
        "/sales/",
        json={
            "product_id": product["product_id"],
            "quantity": product["current_stock"] + 100000,
            "unit_selling_price": 100,
            "payment_mode": "CASH",
        },
    )

    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]


def test_create_purchase_and_increase_stock():
    products_response = client.get("/products/")
    assert products_response.status_code == 200

    product = products_response.json()[0]
    product_id = product["product_id"]
    initial_stock = product["current_stock"]

    response = client.post(
        "/purchases/",
        json={
            "product_id": product_id,
            "quantity": 2,
            "unit_purchase_price": 50,
            "payment_status": "PAID",
        },
    )

    assert response.status_code == 201

    purchase = response.json()

    assert purchase["product_id"] == product_id
    assert purchase["quantity"] == 2
    assert purchase["unit_purchase_price"] == 50
    assert purchase["total_amount"] == 100
    assert purchase["payment_status"] == "PAID"

    # Verify stock increased
    products_after = client.get("/products/").json()
    updated_product = next(
        p for p in products_after
        if p["product_id"] == product_id
    )

    assert updated_product["current_stock"] == initial_stock + 2


def test_create_customer():
    response = client.post(
        "/customers/",
        json={
            "name": "Test Customer",
            "phone": "9999999999",
        },
    )

    assert response.status_code == 201

    customer = response.json()

    assert customer["name"] == "Test Customer"
    assert customer["phone"] == "9999999999"
    assert "customer_id" in customer


def test_duplicate_customer_phone_is_rejected():
    phone = "8888888888"

    first_response = client.post(
        "/customers/",
        json={
            "name": "Customer One",
            "phone": phone,
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/customers/",
        json={
            "name": "Customer Two",
            "phone": phone,
        },
    )

    assert second_response.status_code == 409
    assert "already exists" in second_response.json()["detail"]


def test_customer_balances_endpoint():
    response = client.get("/customers/balances/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

    for customer in response.json():
        assert "customer_id" in customer
        assert "name" in customer
        assert "total_credit" in customer
        assert "total_paid" in customer
        assert "outstanding_balance" in customer

        assert (
            abs(
                customer["outstanding_balance"]
                - (
                    customer["total_credit"]
                    - customer["total_paid"]
                )
            )
            < 0.001
        )