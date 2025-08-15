import { createServer } from 'vite'
import express from 'express'
import cors from 'cors'

// Create Vite dev server
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa'
})

// Create Express app
const app = express()

// Enable CORS
app.use(cors())
app.use(express.json())

// API routes first
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    frontend: 'connected',
    message: 'Faredown system operational'
  })
})

app.get('/api/pricing/test-quote', (req, res) => {
  res.json({
    success: true,
    message: 'Pricing API working',
    data: {
      testQuote: {
        module: 'air',
        basePrice: 5000,
        markupPrice: 5500,
        savings: 500
      }
    }
  })
})

// Use Vite's connect instance as middleware
app.use(vite.ssrFixStacktrace)
app.use(vite.middlewares)

// Start server
const port = 8080
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Faredown Dev Server: http://localhost:${port}`)
  console.log(`📱 Frontend: Serving React app`)
  console.log(`🔧 API: /api/* endpoints available`)
  console.log(`✅ Ready for preview`)
})
