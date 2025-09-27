#!/bin/bash

# Generate JWT token
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: 'admin',
  firstName: 'Admin', 
  lastName: 'User',
  email: 'admin@faredown.com',
  role: 'super_admin',
  department: 'administration',
  permissions: ['all']
}, 'faredown-secret-key-2025', {
  expiresIn: '7d',
  issuer: 'faredown-api',
  audience: 'faredown-frontend'
});
console.log(token);
")

echo "🔑 Generated Token: ${TOKEN:0:50}..."

# Test admin dashboard endpoint
echo ""
echo "🧪 Testing /api/admin/dashboard with curl:"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/admin/dashboard

echo ""
echo "🧪 Testing /api/admin/users with curl:"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/admin/users
