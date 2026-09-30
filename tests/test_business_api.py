from time import time_ns

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_auth_headers():
    response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


def test_create_sale_and_reduce_stock():
    headers = get_auth_headers()

    products_response = client.get(
        "/products/",
        headers=headers,
    )

    assert products_response.status_code == 200

    products = products_response.json()

    assert len(products) > 0

    product = products[0]

    product_id = product["product_id"]
    initial_stock = product["current_stock"]

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

    products_after = client.get(
        "/products/",
        headers=headers,
    ).json()

    updated_product = next(
        p for p in products_after
        if p["product_id"] == product_id
    )

    assert updated_product["current_stock"] == initial_stock - 1


def test_sale_fails_when_stock_is_insufficient():
    headers = get_auth_headers()

    products_response = client.get(
        "/products/",
        headers=headers,
    )

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
    headers = get_auth_headers()

    products_response = client.get(
        "/products/",
        headers=headers,
    )

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

    products_after = client.get(
        "/products/",
        headers=headers,
    ).json()

    updated_product = next(
        p for p in products_after
        if p["product_id"] == product_id
    )

    assert updated_product["current_stock"] == initial_stock + 2


def test_create_customer():
    headers = get_auth_headers()

    phone = "9" + str(time_ns())[-9:]

    response = client.post(
        "/customers/",
        headers=headers,
        json={
            "name": "Test Customer",
            "phone": phone,
        },
    )

    assert response.status_code == 201

    customer = response.json()

    assert customer["name"] == "Test Customer"
    assert customer["phone"] == phone
    assert "customer_id" in customer


def test_duplicate_customer_phone_is_rejected():
    headers = get_auth_headers()

    phone = "8" + str(time_ns())[-9:]

    first_response = client.post(
        "/customers/",
        headers=headers,
        json={
            "name": "Customer One",
            "phone": phone,
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/customers/",
        headers=headers,
        json={
            "name": "Customer Two",
            "phone": phone,
        },
    )

    assert second_response.status_code == 409
    assert "already exists" in second_response.json()["detail"]


def test_customer_balances_endpoint():
    headers = get_auth_headers()

    response = client.get(
        "/customers/balances/",
        headers=headers,
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)

    for customer in response.json():
        assert "customer_id" in customer
        assert "name" in customer
        assert "total_credit" in customer
        assert "total_paid" in customer
        assert "outstanding_balance" in customer

        assert abs(
            customer["outstanding_balance"]
            - (
                customer["total_credit"]
                - customer["total_paid"]
            )
        ) < 0.001


def test_products_are_isolated_by_shop():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_token = radhika_response.json()["access_token"]

    radhika_headers = {
        "Authorization": f"Bearer {radhika_token}"
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_token = aarya_response.json()["access_token"]

    aarya_headers = {
        "Authorization": f"Bearer {aarya_token}"
    }

    # Find an unused product ID
    radhika_products = client.get(
        "/products/",
        headers=radhika_headers,
    ).json()

    aarya_products = client.get(
        "/products/",
        headers=aarya_headers,
    ).json()

    existing_ids = {
        product["product_id"]
        for product in radhika_products + aarya_products
    }

    product_id = 900000

    while product_id in existing_ids:
        product_id += 1

    # Create a product in Aarya's shop
    create_response = client.post(
        "/products/",
        headers=aarya_headers,
        json={
            "product_id": product_id,
            "name": "Aarya Test Product",
            "current_stock": 50,
            "average_daily_sales": 5,
            "purchase_price": 20,
            "supplier_lead_time_days": 2,
        },
    )

    assert create_response.status_code == 200

    created_product = create_response.json()

    assert created_product["product_id"] == product_id
    assert created_product["name"] == "Aarya Test Product"

    # Aarya should see her product
    aarya_products_after = client.get(
        "/products/",
        headers=aarya_headers,
    )

    assert aarya_products_after.status_code == 200

    aarya_product_ids = {
        product["product_id"]
        for product in aarya_products_after.json()
    }

    assert product_id in aarya_product_ids

    # Radhika should NOT see Aarya's product
    radhika_products_after = client.get(
        "/products/",
        headers=radhika_headers,
    )

    assert radhika_products_after.status_code == 200

    radhika_product_ids = {
        product["product_id"]
        for product in radhika_products_after.json()
    }

    assert product_id not in radhika_product_ids


def test_customers_are_isolated_by_shop():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_token = radhika_response.json()["access_token"]

    radhika_headers = {
        "Authorization": f"Bearer {radhika_token}"
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_token = aarya_response.json()["access_token"]

    aarya_headers = {
        "Authorization": f"Bearer {aarya_token}"
    }

    # Generate a unique phone number
    phone = "7" + str(time_ns())[-9:]

    # Create a customer in Aarya's shop
    response = client.post(
        "/customers/",
        headers=aarya_headers,
        json={
            "name": "Aarya Private Customer",
            "phone": phone,
        },
    )

    assert response.status_code == 201

    aarya_customer = response.json()

    assert aarya_customer["name"] == "Aarya Private Customer"
    assert aarya_customer["phone"] == phone

    customer_id = aarya_customer["customer_id"]

    # Aarya should see the customer
    aarya_customers = client.get(
        "/customers/",
        headers=aarya_headers,
    )

    assert aarya_customers.status_code == 200

    aarya_customer_ids = {
        customer["customer_id"]
        for customer in aarya_customers.json()
    }

    assert customer_id in aarya_customer_ids

    # Radhika should NOT see the customer
    radhika_customers = client.get(
        "/customers/",
        headers=radhika_headers,
    )

    assert radhika_customers.status_code == 200

    radhika_customer_ids = {
        customer["customer_id"]
        for customer in radhika_customers.json()
    }

    assert customer_id not in radhika_customer_ids


def test_same_customer_phone_allowed_across_different_shops():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_headers = {
        "Authorization": (
            f"Bearer {radhika_response.json()['access_token']}"
        )
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_headers = {
        "Authorization": (
            f"Bearer {aarya_response.json()['access_token']}"
        )
    }

    # Generate a unique phone number
    phone = "6" + str(time_ns())[-9:]

    # Create customer in Radhika's shop
    radhika_create = client.post(
        "/customers/",
        headers=radhika_headers,
        json={
            "name": "Radhika Customer",
            "phone": phone,
        },
    )

    assert radhika_create.status_code == 201

    # Same phone in Aarya's shop should be allowed
    aarya_create = client.post(
        "/customers/",
        headers=aarya_headers,
        json={
            "name": "Aarya Customer",
            "phone": phone,
        },
    )

    assert aarya_create.status_code == 201


def test_credit_is_created_only_for_shop_customer():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_headers = {
        "Authorization": (
            f"Bearer {radhika_response.json()['access_token']}"
        )
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_headers = {
        "Authorization": (
            f"Bearer {aarya_response.json()['access_token']}"
        )
    }

    # Create a customer in Aarya's shop
    phone = "5" + str(time_ns())[-9:]

    customer_response = client.post(
        "/customers/",
        headers=aarya_headers,
        json={
            "name": "Aarya Credit Customer",
            "phone": phone,
        },
    )

    assert customer_response.status_code == 201

    aarya_customer_id = customer_response.json()["customer_id"]

    # Aarya can create credit for her own customer
    aarya_credit_response = client.post(
        "/credits/",
        headers=aarya_headers,
        json={
            "customer_id": aarya_customer_id,
            "amount": 500,
            "description": "Aarya shop credit test",
        },
    )

    assert aarya_credit_response.status_code == 201

    aarya_credit = aarya_credit_response.json()

    assert aarya_credit["customer_id"] == aarya_customer_id
    assert aarya_credit["amount"] == 500
    assert aarya_credit["paid_amount"] == 0

    # Radhika must NOT be able to create credit
    # for Aarya's customer
    radhika_credit_response = client.post(
        "/credits/",
        headers=radhika_headers,
        json={
            "customer_id": aarya_customer_id,
            "amount": 1000,
            "description": "Unauthorized credit attempt",
        },
    )

    assert radhika_credit_response.status_code == 404
    assert radhika_credit_response.json()["detail"] == "Customer not found"


def test_credits_are_isolated_by_shop():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_headers = {
        "Authorization": (
            f"Bearer {radhika_response.json()['access_token']}"
        )
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_headers = {
        "Authorization": (
            f"Bearer {aarya_response.json()['access_token']}"
        )
    }

    # Create a customer in Aarya's shop
    phone = "4" + str(time_ns())[-9:]

    customer_response = client.post(
        "/customers/",
        headers=aarya_headers,
        json={
            "name": "Aarya Private Credit Customer",
            "phone": phone,
        },
    )

    assert customer_response.status_code == 201

    customer_id = customer_response.json()["customer_id"]

    # Create credit for Aarya's customer
    credit_response = client.post(
        "/credits/",
        headers=aarya_headers,
        json={
            "customer_id": customer_id,
            "amount": 750,
            "description": "Private Aarya credit",
        },
    )

    assert credit_response.status_code == 201

    credit_id = credit_response.json()["credit_id"]

    # Aarya should see the credit
    aarya_credits = client.get(
        "/credits/",
        headers=aarya_headers,
    )

    assert aarya_credits.status_code == 200

    aarya_credit_ids = {
        credit["credit_id"]
        for credit in aarya_credits.json()
    }

    assert credit_id in aarya_credit_ids

    # Radhika should NOT see Aarya's credit
    radhika_credits = client.get(
        "/credits/",
        headers=radhika_headers,
    )

    assert radhika_credits.status_code == 200

    radhika_credit_ids = {
        credit["credit_id"]
        for credit in radhika_credits.json()
    }

    assert credit_id not in radhika_credit_ids

def test_credit_payment_isolated_by_shop():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_headers = {
        "Authorization": (
            f"Bearer {radhika_response.json()['access_token']}"
        )
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_headers = {
        "Authorization": (
            f"Bearer {aarya_response.json()['access_token']}"
        )
    }

    # Create a customer in Aarya's shop
    phone = "3" + str(time_ns())[-9:]

    customer_response = client.post(
        "/customers/",
        headers=aarya_headers,
        json={
            "name": "Aarya Payment Customer",
            "phone": phone,
        },
    )

    assert customer_response.status_code == 201

    customer_id = customer_response.json()["customer_id"]

    # Create a credit for Aarya's customer
    credit_response = client.post(
        "/credits/",
        headers=aarya_headers,
        json={
            "customer_id": customer_id,
            "amount": 1000,
            "description": "Payment isolation test",
        },
    )

    assert credit_response.status_code == 201

    credit_id = credit_response.json()["credit_id"]

    # Aarya can make a payment against her own credit
    payment_response = client.post(
        "/credits/payments/",
        headers=aarya_headers,
        json={
            "credit_id": credit_id,
            "amount": 300,
            "payment_method": "CASH",
        },
    )

    assert payment_response.status_code == 201

    payment = payment_response.json()

    assert payment["credit_id"] == credit_id
    assert payment["amount"] == 300
    assert payment["payment_method"] == "CASH"

    # Radhika must NOT be able to pay Aarya's credit
    unauthorized_payment = client.post(
        "/credits/payments/",
        headers=radhika_headers,
        json={
            "credit_id": credit_id,
            "amount": 100,
            "payment_method": "CASH",
        },
    )

    assert unauthorized_payment.status_code == 404
    assert unauthorized_payment.json()["detail"] == "Credit entry not found"


def test_credit_payments_are_isolated_by_shop():
    # Login as Radhika
    radhika_response = client.post(
        "/auth/login",
        json={
            "email": "radhika.demo@example.com",
            "password": "Radhika@123",
        },
    )

    assert radhika_response.status_code == 200

    radhika_headers = {
        "Authorization": (
            f"Bearer {radhika_response.json()['access_token']}"
        )
    }

    # Login as Aarya
    aarya_response = client.post(
        "/auth/login",
        json={
            "email": "aarya.demo@example.com",
            "password": "Aarya@123",
        },
    )

    assert aarya_response.status_code == 200

    aarya_headers = {
        "Authorization": (
            f"Bearer {aarya_response.json()['access_token']}"
        )
    }

    # Create a customer in Aarya's shop
    phone = "2" + str(time_ns())[-9:]

    customer_response = client.post(
        "/customers/",
        headers=aarya_headers,
        json={
            "name": "Aarya Payment Visibility Customer",
            "phone": phone,
        },
    )

    assert customer_response.status_code == 201

    customer_id = customer_response.json()["customer_id"]

    # Create a credit
    credit_response = client.post(
        "/credits/",
        headers=aarya_headers,
        json={
            "customer_id": customer_id,
            "amount": 800,
            "description": "Payment visibility test",
        },
    )

    assert credit_response.status_code == 201

    credit_id = credit_response.json()["credit_id"]

    # Create a payment
    payment_response = client.post(
        "/credits/payments/",
        headers=aarya_headers,
        json={
            "credit_id": credit_id,
            "amount": 200,
            "payment_method": "UPI",
        },
    )

    assert payment_response.status_code == 201

    payment_id = payment_response.json()["payment_id"]

    # Aarya should see the payment
    aarya_payments = client.get(
        "/credits/payments/",
        headers=aarya_headers,
    )

    assert aarya_payments.status_code == 200

    aarya_payment_ids = {
        payment["payment_id"]
        for payment in aarya_payments.json()
    }

    assert payment_id in aarya_payment_ids

    # Radhika should NOT see Aarya's payment
    radhika_payments = client.get(
        "/credits/payments/",
        headers=radhika_headers,
    )

    assert radhika_payments.status_code == 200

    radhika_payment_ids = {
        payment["payment_id"]
        for payment in radhika_payments.json()
    }

    assert payment_id not in radhika_payment_ids