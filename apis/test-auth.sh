#!/bin/bash

# Script de teste da autenticação JWT
# Uso: bash test-auth.sh

API_URL="http://localhost:8000"

echo "=== API JWT Authentication Test ==="
echo ""

# 1. Health Check
echo "1. Health Check"
curl -s "$API_URL/api/health" | jq .
echo ""

# 2. Login
echo "2. Login (POST /api/auth/login)"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "master@corp.com",
    "password": "123456"
  }')

echo "$LOGIN_RESPONSE" | jq .

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# 3. Get User Info
echo "3. Get User Info (GET /api/auth/me)"
curl -s "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 4. List Projects (Protected)
echo "4. List Projects with Authentication (GET /api/projects?tenantId=1)"
curl -s "$API_URL/api/projects?tenantId=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 5. Try without token (should fail)
echo "5. List Projects without Token (should fail with 401)"
curl -s "$API_URL/api/projects?tenantId=1" | jq .
echo ""

# 6. Refresh Token
echo "6. Refresh Token (POST /api/auth/refresh)"
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/refresh" \
  -H "Authorization: Bearer $TOKEN")

echo "$REFRESH_RESPONSE" | jq .
echo ""

echo "=== Test Complete ==="
