const express = require('express');
const router = express.Router();
const hotelbedsService = require('../services/hotelbedsService');
const markupService = require('../services/markupService');

// Mock supplier data - in production this would be from database
let suppliers = [
  {
    id: '1',
    name: 'Hotelbeds',
    type: 'hotel',
    status: 'active',
    apiEndpoint: 'https://api.test.hotelbeds.com',
    lastSync: new Date().toISOString(),
    totalBookings: 1247,
    successRate: 94.2,
    averageResponseTime: 850,
    credentials: {
      apiKey: '91d2368789abdb5beec101ce95a9d185',
      secret: 'a9ffaaecce'
    },
    configuration: {
      contentAPI: 'https://api.test.hotelbeds.com/hotel-content-api/1.0/',
      bookingAPI: 'https://api.test.hotelbeds.com/hotel-api/1.0/',
      timeoutMs: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
      syncFrequency: 'daily'
    },
    supportedCurrencies: ['EUR', 'USD', 'GBP', 'INR'],
    supportedDestinations: ['Dubai', 'Mumbai', 'Delhi', 'Singapore'],
    markup: {
      defaultPercentage: 12,
      minPercentage: 8,
      maxPercentage: 25
    }
  }
];

let syncLogs = [
  {
    id: '1',
    supplierId: '1',
    timestamp: new Date().toISOString(),
    status: 'success',
    recordsProcessed: 1247,
    duration: 45000,
    errors: [],
    details: 'Full hotel content sync completed successfully'
  }
];

/**
 * Get all suppliers
 * GET /api/suppliers
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get suppliers',
      details: error.message
    });
  }
});

/**
 * Get supplier by ID
 * GET /api/suppliers/:id
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const supplier = suppliers.find(s => s.id === id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get supplier',
      details: error.message
    });
  }
});

/**
 * Create new supplier
 * POST /api/suppliers
 */
router.post('/', (req, res) => {
  try {
    const supplierData = req.body;
    
    // Validate required fields
    if (!supplierData.name || !supplierData.type || !supplierData.apiEndpoint) {
      return res.status(400).json({
        success: false,
        error: 'Name, type, and API endpoint are required'
      });
    }
    
    const newSupplier = {
      id: Date.now().toString(),
      name: supplierData.name,
      type: supplierData.type,
      status: 'testing',
      apiEndpoint: supplierData.apiEndpoint,
      lastSync: '',
      totalBookings: 0,
      successRate: 0,
      averageResponseTime: 0,
      credentials: supplierData.credentials || { apiKey: '', secret: '' },
      configuration: {
        timeoutMs: 30000,
        retryAttempts: 3,
        cacheEnabled: true,
        syncFrequency: 'daily',
        ...supplierData.configuration
      },
      supportedCurrencies: supplierData.supportedCurrencies || [],
      supportedDestinations: supplierData.supportedDestinations || [],
      markup: {
        defaultPercentage: 10,
        minPercentage: 5,
        maxPercentage: 20,
        ...supplierData.markup
      }
    };
    
    suppliers.push(newSupplier);
    
    res.status(201).json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create supplier',
      details: error.message
    });
  }
});

/**
 * Update supplier
 * PUT /api/suppliers/:id
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      ...updates,
      id // Ensure ID doesn't change
    };
    
    res.json({
      success: true,
      data: suppliers[supplierIndex],
      message: 'Supplier updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier',
      details: error.message
    });
  }
});

/**
 * Delete supplier
 * DELETE /api/suppliers/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const supplierIndex = suppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    const deletedSupplier = suppliers.splice(supplierIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedSupplier,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier',
      details: error.message
    });
  }
});

/**
 * Toggle supplier status
 * PATCH /api/suppliers/:id/status
 */
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'testing'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be active, inactive, or testing'
      });
    }
    
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    supplier.status = status;
    
    res.json({
      success: true,
      data: supplier,
      message: `Supplier status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier status',
      details: error.message
    });
  }
});

/**
 * Sync supplier data
 * POST /api/suppliers/:id/sync
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationCodes = [], forceSync = false } = req.body;
    
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }
    
    if (supplier.type !== 'hotel' || supplier.name !== 'Hotelbeds') {
      return res.status(400).json({
        success: false,
        error: 'Sync is currently only supported for Hotelbeds'
      });
    }
    
    // Perform sync
    const syncResult = await hotelbedsService.syncHotelContent(destinationCodes, forceSync);
    
    // Update supplier last sync time
    supplier.lastSync = new Date().toISOString();\n    \n    // Create sync log\n    const syncLog = {\n      id: Date.now().toString(),\n      supplierId: id,\n      timestamp: supplier.lastSync,\n      status: syncResult.success ? 'success' : 'failed',\n      recordsProcessed: syncResult.totalHotels || 0,\n      duration: 30000, // Mock duration\n      errors: syncResult.success ? [] : [syncResult.error || 'Unknown error'],\n      details: syncResult.message || 'Manual sync triggered'\n    };\n    \n    syncLogs.unshift(syncLog);\n    \n    res.json({\n      success: true,\n      data: {\n        supplier,\n        syncResult,\n        syncLog\n      },\n      message: 'Sync completed successfully'\n    });\n  } catch (error) {\n    console.error('Supplier sync error:', error);\n    res.status(500).json({\n      success: false,\n      error: 'Failed to sync supplier data',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Test supplier connection\n * POST /api/suppliers/:id/test\n */\nrouter.post('/:id/test', async (req, res) => {\n  try {\n    const { id } = req.params;\n    \n    const supplier = suppliers.find(s => s.id === id);\n    if (!supplier) {\n      return res.status(404).json({\n        success: false,\n        error: 'Supplier not found'\n      });\n    }\n    \n    // For Hotelbeds, test by getting destinations\n    if (supplier.type === 'hotel' && supplier.name === 'Hotelbeds') {\n      try {\n        const destinations = await hotelbedsService.searchDestinations('Dubai');\n        \n        const testResult = {\n          success: true,\n          responseTime: Math.floor(Math.random() * 2000) + 500,\n          status: 'connected',\n          details: `Found ${destinations.length} destinations`,\n          timestamp: new Date().toISOString()\n        };\n        \n        res.json({\n          success: true,\n          data: testResult,\n          message: 'Connection test successful'\n        });\n      } catch (error) {\n        res.json({\n          success: false,\n          data: {\n            success: false,\n            responseTime: 0,\n            status: 'failed',\n            details: error.message,\n            timestamp: new Date().toISOString()\n          },\n          message: 'Connection test failed'\n        });\n      }\n    } else {\n      // Mock test for other suppliers\n      const testResult = {\n        success: true,\n        responseTime: Math.floor(Math.random() * 2000) + 500,\n        status: 'connected',\n        details: 'Mock connection test successful',\n        timestamp: new Date().toISOString()\n      };\n      \n      res.json({\n        success: true,\n        data: testResult,\n        message: 'Connection test successful'\n      });\n    }\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to test supplier connection',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Get sync logs\n * GET /api/suppliers/sync-logs\n */\nrouter.get('/sync-logs', (req, res) => {\n  try {\n    const { supplierId, limit = 50 } = req.query;\n    \n    let filteredLogs = syncLogs;\n    if (supplierId) {\n      filteredLogs = syncLogs.filter(log => log.supplierId === supplierId);\n    }\n    \n    const limitedLogs = filteredLogs.slice(0, parseInt(limit));\n    \n    res.json({\n      success: true,\n      data: limitedLogs,\n      total: filteredLogs.length\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to get sync logs',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Get supplier analytics\n * GET /api/suppliers/analytics\n */\nrouter.get('/analytics', (req, res) => {\n  try {\n    const analytics = {\n      totalSuppliers: suppliers.length,\n      activeSuppliers: suppliers.filter(s => s.status === 'active').length,\n      testingSuppliers: suppliers.filter(s => s.status === 'testing').length,\n      inactiveSuppliers: suppliers.filter(s => s.status === 'inactive').length,\n      averageSuccessRate: suppliers.reduce((sum, s) => sum + s.successRate, 0) / suppliers.length,\n      averageResponseTime: suppliers.reduce((sum, s) => sum + s.averageResponseTime, 0) / suppliers.length,\n      totalBookings: suppliers.reduce((sum, s) => sum + s.totalBookings, 0),\n      supplierTypes: {\n        hotel: suppliers.filter(s => s.type === 'hotel').length,\n        flight: suppliers.filter(s => s.type === 'flight').length,\n        car: suppliers.filter(s => s.type === 'car').length,\n        package: suppliers.filter(s => s.type === 'package').length\n      },\n      recentSyncs: syncLogs.slice(0, 10)\n    };\n    \n    res.json({\n      success: true,\n      data: analytics\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to get supplier analytics',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Get markup rules\n * GET /api/suppliers/markup-rules\n */\nrouter.get('/markup-rules', (req, res) => {\n  try {\n    const rules = markupService.getAllRules();\n    const stats = markupService.getMarkupStats();\n    \n    res.json({\n      success: true,\n      data: {\n        rules,\n        stats\n      }\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to get markup rules',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Create markup rule\n * POST /api/suppliers/markup-rules\n */\nrouter.post('/markup-rules', (req, res) => {\n  try {\n    const ruleData = req.body;\n    \n    // Validate rule\n    const validation = markupService.validateRule(ruleData);\n    if (!validation.isValid) {\n      return res.status(400).json({\n        success: false,\n        error: 'Invalid markup rule',\n        details: validation.errors\n      });\n    }\n    \n    const newRule = markupService.addMarkupRule(ruleData);\n    \n    res.status(201).json({\n      success: true,\n      data: newRule,\n      message: 'Markup rule created successfully'\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to create markup rule',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Update markup rule\n * PUT /api/suppliers/markup-rules/:ruleId\n */\nrouter.put('/markup-rules/:ruleId', (req, res) => {\n  try {\n    const { ruleId } = req.params;\n    const updates = req.body;\n    \n    // Validate updates\n    const validation = markupService.validateRule({ ...updates, id: ruleId });\n    if (!validation.isValid) {\n      return res.status(400).json({\n        success: false,\n        error: 'Invalid markup rule updates',\n        details: validation.errors\n      });\n    }\n    \n    const updatedRule = markupService.updateMarkupRule(ruleId, updates);\n    if (!updatedRule) {\n      return res.status(404).json({\n        success: false,\n        error: 'Markup rule not found'\n      });\n    }\n    \n    res.json({\n      success: true,\n      data: updatedRule,\n      message: 'Markup rule updated successfully'\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to update markup rule',\n      details: error.message\n    });\n  }\n});\n\n/**\n * Delete markup rule\n * DELETE /api/suppliers/markup-rules/:ruleId\n */\nrouter.delete('/markup-rules/:ruleId', (req, res) => {\n  try {\n    const { ruleId } = req.params;\n    \n    const deletedRule = markupService.deleteMarkupRule(ruleId);\n    if (!deletedRule) {\n      return res.status(404).json({\n        success: false,\n        error: 'Markup rule not found'\n      });\n    }\n    \n    res.json({\n      success: true,\n      data: deletedRule,\n      message: 'Markup rule deleted successfully'\n    });\n  } catch (error) {\n    res.status(500).json({\n      success: false,\n      error: 'Failed to delete markup rule',\n      details: error.message\n    });\n  }\n});\n\nmodule.exports = router;"}