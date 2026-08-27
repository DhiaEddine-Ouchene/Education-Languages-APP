import requests
import string
import random

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = "/api/auth/register"
TIMEOUT = 30

def generate_random_email():
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"testuser_{random_part}@example.com"

def test_postapiauthregistershouldcreateuser():
    email = generate_random_email()
    password = "StrongPass!123"
    register_payload = {
        "email": email,
        "password": password,
        "name": "Test User"
    }
    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(
        BASE_URL + REGISTER_ENDPOINT,
        json=register_payload,
        headers=headers,
        timeout=TIMEOUT
    )
    assert response.status_code == 200, f"Expected 200 OK on register but got {response.status_code}"

# Run test

test_postapiauthregistershouldcreateuser()
