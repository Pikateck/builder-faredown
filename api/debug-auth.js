const jwt = require('jsonwebtoken');

// Test JWT token creation and verification
function debugAuth() {
  console.log('🔍 Debugging Authentication...\n');
  
  const JWT_SECRET = process.env.JWT_SECRET || "faredown-secret-key-2025";
  console.log('🔑 JWT Secret:', JWT_SECRET);
  
  const adminPayload = {
    id: "admin",
    firstName: "Admin",
    lastName: "User", 
    email: "admin@faredown.com",
    role: "super_admin",
    department: "administration",
    permissions: ["all"],
  };
  
  console.log('👤 Admin Payload:', JSON.stringify(adminPayload, null, 2));
  
  const token = jwt.sign(adminPayload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "faredown-api",
    audience: "faredown-frontend",
  });
  
  console.log('🎫 Generated Token:', token);
  console.log('📏 Token Length:', token.length);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token Verification Success:', JSON.stringify(decoded, null, 2));
  } catch (error) {
    console.log('❌ Token Verification Failed:', error.message);
  }
  
  // Test the exact header format
  console.log('\n📡 Header Format Test:');
  console.log('Authorization:', `Bearer ${token}`);
  
  // Test manual header parsing like the middleware does
  const authHeader = `Bearer ${token}`;
  const extractedToken = authHeader && authHeader.split(" ")[1];
  console.log('🔧 Extracted Token:', extractedToken);
  console.log('🔍 Tokens Match:', token === extractedToken);
}

debugAuth();
