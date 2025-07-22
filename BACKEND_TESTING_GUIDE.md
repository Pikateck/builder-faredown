# 🧪 Complete Backend Testing Guide

## 🚀 Quick Start - Backend Testing

### Step 1: Start Your Backend Server

1. **Open a new terminal** (separate from your frontend)
2. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

3. **Install dependencies** (first time only):

   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**

   ```bash
   python main.py
   ```

   You should see:

   ```
   🚀 Faredown Backend API Starting...
   📅 Started at: 2024-XX-XX XX:XX:XX
   🌐 Environment: development
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

5. **Verify backend is running:**
   - Open: http://localhost:8000
   - You should see: "🎯 Faredown Backend API - Live and Running!"

---

## 📊 Step 2: Use Testing Dashboard

**Navigate to:** http://localhost:5173/backend-test

This comprehensive dashboard provides:

### 🔍 **Backend Status Check**

- Real-time backend connectivity
- Health check validation
- API endpoint availability

### 📱 **Page-by-Page Testing**

- **Homepage (/)** - Search functionality
- **Flight Results (/flights)** - Flight search & bargain integration
- **Hotels (/hotels)** - Hotel search & booking
- **Booking Flow (/booking-flow)** - Payment & completion
- **Account Pages** - User management

### 🔐 **Authentication Testing**

- User login/registration
- JWT token management
- Profile access

### 🛠 **API Endpoint Testing**

- All backend APIs (Auth, Flights, Hotels, Bargain Engine)
- Response validation
- Performance metrics

---

## 🎯 Step 3: Manual Page Testing

### **Homepage Testing**

1. **Go to:** http://localhost:5173/
2. **Test Features:**
   - ✅ Search form functionality
   - ✅ Date picker
   - ✅ City selection
   - ✅ Traveler selection
   - ✅ Currency conversion
   - ✅ Mobile responsiveness

### **Flight Search Testing**

1. **Go to:** http://localhost:5173/flights
2. **Test Features:**
   - ✅ Flight search results (should load from backend)
   - ✅ Filter functionality
   - ✅ Bargain modal (AI-powered bargaining)
   - ✅ Booking flow integration
   - ✅ Mobile filter interface

### **Hotel Search Testing**

1. **Go to:** http://localhost:5173/hotels
2. **Test Features:**
   - ✅ Hotel search results
   - ✅ Room type selection
   - ✅ Availability checking
   - ✅ Booking integration

### **Authentication Testing**

1. **Test Registration:**

   - Click "Register" on any page
   - Test with new email
   - Verify backend creates user

2. **Test Login:**
   - Use test credentials: `test@faredown.com` / `password123`
   - Verify JWT token storage
   - Check user profile access

### **Booking Flow Testing**

1. **Start from flight/hotel selection**
2. **Test complete flow:**
   - ✅ Passenger details form
   - ✅ Seat selection (flights)
   - ✅ Payment integration
   - ✅ Booking confirmation
   - ✅ Email notifications

---

## 🔧 Step 4: Backend API Testing

### **Direct API Testing**

**Backend API Documentation:**

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### **Key Endpoints to Test:**

1. **Health Check:**

   ```
   GET http://localhost:8000/health
   ```

2. **Authentication:**

   ```
   POST http://localhost:8000/api/auth/login
   POST http://localhost:8000/api/auth/register
   GET http://localhost:8000/api/auth/me
   ```

3. **Flight Search:**

   ```
   GET http://localhost:8000/api/airlines/search
   GET http://localhost:8000/api/airlines/destinations/popular
   ```

4. **Hotel Search:**

   ```
   GET http://localhost:8000/api/hotels/search
   GET http://localhost:8000/api/hotels/destinations/popular
   ```

5. **Bargain Engine:**
   ```
   POST http://localhost:8000/api/bargain/start
   GET http://localhost:8000/api/bargain/statistics
   ```

---

## 📱 Step 5: Mobile Responsiveness Testing

### **Test All Breakpoints:**

1. **Mobile (320px - 768px)**

   - All pages should be touch-friendly
   - Navigation should collapse to hamburger menu
   - Forms should be easy to use on mobile

2. **Tablet (768px - 1024px)**

   - Layout should adapt smoothly
   - All features accessible

3. **Desktop (1024px+)**
   - Full feature set available
   - Optimal user experience

### **Mobile-Specific Features:**

- ✅ Mobile search interface
- ✅ Touch-friendly buttons
- ✅ Mobile-optimized forms
- ✅ Responsive images
- ✅ Mobile navigation

---

## 🐛 Step 6: Common Issues & Solutions

### **Backend Not Starting:**

```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill existing process
kill -9 <PID>

# Restart backend
cd backend && python main.py
```

### **Database Issues:**

```bash
# Reset database (if needed)
rm -f faredown.db
cd backend && python main.py
```

### **Frontend API Connection Issues:**

1. **Check .env file** has correct backend URL
2. **Verify CORS settings** in backend
3. **Check network tab** in browser dev tools

### **Authentication Issues:**

1. **Clear localStorage:**
   ```javascript
   localStorage.clear();
   ```
2. **Check JWT token expiration**
3. **Verify backend auth endpoints**

---

## ✅ Step 7: Success Checklist

### **Backend Working When:**

- [ ] Health check returns 200 OK
- [ ] API documentation loads at /docs
- [ ] Authentication endpoints work
- [ ] Flight search returns results
- [ ] Hotel search returns results
- [ ] Bargain engine responds

### **Frontend Integration Working When:**

- [ ] All pages load without errors
- [ ] Search functionality connects to backend
- [ ] Authentication flows work
- [ ] Booking flows complete successfully
- [ ] Mobile interface is responsive
- [ ] Real data loads from backend APIs

### **Full Integration Success When:**

- [ ] User can search flights/hotels
- [ ] Real-time bargaining works
- [ ] Bookings save to database
- [ ] Email notifications send
- [ ] User accounts persist
- [ ] All mobile features work

---

## 🎯 Quick Testing URLs

Once your backend is running on `http://localhost:8000`:

1. **Testing Dashboard:** http://localhost:5173/backend-test
2. **API Documentation:** http://localhost:8000/docs
3. **Health Check:** http://localhost:8000/health
4. **Frontend Pages:**
   - Homepage: http://localhost:5173/
   - Flights: http://localhost:5173/flights
   - Hotels: http://localhost:5173/hotels
   - Booking: http://localhost:5173/booking-flow

---

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** for JavaScript errors
2. **Check backend logs** in terminal
3. **Use the testing dashboard** for detailed diagnostics
4. **Verify API responses** in network tab

The testing dashboard at `/backend-test` will guide you through everything step by step! 🚀
