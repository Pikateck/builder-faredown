const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

// Load comprehensive seed data
const { loadSeedData } = require('../scripts/seed-admin-data');
const seedData = loadSeedData();

// Mock database - in real implementation, use proper database
let inventory = seedData.extranetInventory || [
  {
    id: "inv_001",
    module: "flights",
    title: "Direct Flight - Mumbai to Dubai",
    description: "Premium direct flight service with excellent amenities",
    location: {
      city: "Mumbai",
      country: "India",
      region: "South Asia"
    },
    pricing: {
      basePrice: 25000,
      currency: "INR",
      priceType: "per_person"
    },
    availability: {
      status: "active",
      startDate: "2024-03-01",
      endDate: "2024-12-31",
      capacity: 180,
      availableSlots: 120
    },
    details: {
      duration: "3h 30m",
      includes: ["Meals", "Baggage", "Seat Selection"],
      excludes: ["Airport Transfers", "Insurance"],
      highlights: ["Premium Service", "On-time Performance", "Comfortable Seating"],
      images: []
    },
    metadata: {
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T14:45:00Z",
      created_by: "admin",
      source: "extranet"
    },
    // Flight-specific fields
    origin: "Mumbai",
    destination: "Dubai",
    airline: "Faredown Airways",
    cabin_class: "Economy"
  },
  {
    id: "inv_002",
    module: "hotels",
    title: "Luxury Hotel - Downtown Dubai",
    description: "5-star luxury accommodation in the heart of Dubai",
    location: {
      city: "Dubai",
      country: "UAE",
      region: "Middle East"
    },
    pricing: {
      basePrice: 15000,
      currency: "INR",
      priceType: "per_room"
    },
    availability: {
      status: "active",
      startDate: "2024-03-01",
      endDate: "2024-12-31",
      capacity: 50,
      availableSlots: 35
    },
    details: {
      includes: ["Breakfast", "WiFi", "Pool Access", "Gym"],
      excludes: ["Airport Transfers", "Spa Services"],
      highlights: ["City View", "Prime Location", "24/7 Room Service"],
      images: []
    },
    metadata: {
      created_at: "2024-01-18T09:15:00Z",
      updated_at: "2024-01-22T16:30:00Z",
      created_by: "admin",
      source: "extranet"
    },
    // Hotel-specific fields
    room_type: "Deluxe Room",
    star_rating: "5",
    amenities: "Pool, Spa, Gym, Restaurant, WiFi"
  }
];

let inventoryStats = {
  flights: { total_items: 12, active_items: 10, draft_items: 2, total_revenue: 1250000, total_bookings: 45, avg_rating: 4.5 },
  hotels: { total_items: 8, active_items: 7, draft_items: 1, total_revenue: 890000, total_bookings: 32, avg_rating: 4.7 },
  sightseeing: { total_items: 15, active_items: 12, draft_items: 3, total_revenue: 650000, total_bookings: 78, avg_rating: 4.3 },
  transfers: { total_items: 6, active_items: 5, draft_items: 1, total_revenue: 320000, total_bookings: 56, avg_rating: 4.6 },
  packages: { total_items: 20, active_items: 16, draft_items: 4, total_revenue: 2840000, total_bookings: 127, avg_rating: 4.6 }
};

/**
 * @route GET /api/admin/extranet/inventory
 * @desc Get extranet inventory items with filtering
 * @access Admin
 */
router.get('/inventory', requireAdmin, async (req, res) => {
  try {
    const { module, search, status, page = 1, limit = 20 } = req.query;
    
    let filteredInventory = [...inventory];
    
    // Filter by module
    if (module && module !== 'all') {
      filteredInventory = filteredInventory.filter(item => item.module === module);
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInventory = filteredInventory.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.location.city.toLowerCase().includes(searchLower) ||
        item.location.country.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by status
    if (status && status !== 'all') {
      filteredInventory = filteredInventory.filter(item => item.availability.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = filteredInventory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          total: filteredInventory.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(filteredInventory.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching extranet inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/extranet/stats
 * @desc Get extranet inventory statistics
 * @access Admin
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { module } = req.query;
    
    if (module && module !== 'all') {
      const moduleStats = inventoryStats[module] || {
        total_items: 0,
        active_items: 0,
        draft_items: 0,
        total_revenue: 0,
        total_bookings: 0,
        avg_rating: 0
      };
      
      res.json({
        success: true,
        data: moduleStats
      });
    } else {
      // Aggregate stats for all modules
      const aggregatedStats = Object.values(inventoryStats).reduce(
        (acc, stats) => ({
          total_items: acc.total_items + stats.total_items,
          active_items: acc.active_items + stats.active_items,
          draft_items: acc.draft_items + stats.draft_items,
          total_revenue: acc.total_revenue + stats.total_revenue,
          total_bookings: acc.total_bookings + stats.total_bookings,
          avg_rating: 0 // Will calculate separately
        }),
        { total_items: 0, active_items: 0, draft_items: 0, total_revenue: 0, total_bookings: 0, avg_rating: 0 }
      );
      
      // Calculate average rating
      const totalRatingSum = Object.values(inventoryStats).reduce(
        (sum, stats) => sum + (stats.avg_rating * stats.total_items), 0
      );
      aggregatedStats.avg_rating = aggregatedStats.total_items > 0 
        ? totalRatingSum / aggregatedStats.total_items 
        : 0;
      
      res.json({
        success: true,
        data: aggregatedStats
      });
    }
  } catch (error) {
    console.error('Error fetching extranet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/extranet/inventory
 * @desc Create new extranet inventory item
 * @access Admin
 */
router.post('/inventory', requireAdmin, auditLog('extranet_create'), async (req, res) => {
  try {
    const {
      module,
      title,
      description,
      location,
      pricing,
      availability,
      details,
      ...moduleSpecificFields
    } = req.body;
    
    // Validation
    if (!module || !title || !description || !location || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: module, title, description, location, pricing'
      });
    }
    
    const newItem = {
      id: `inv_${Date.now()}`,
      module,
      title,
      description,
      location,
      pricing: {
        ...pricing,
        currency: pricing.currency || 'INR'
      },
      availability: {
        status: 'draft',
        ...availability
      },
      details: details || {},
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: req.user.username,
        source: 'extranet'
      },
      ...moduleSpecificFields
    };
    
    inventory.push(newItem);
    
    // Update stats
    if (inventoryStats[module]) {
      inventoryStats[module].total_items++;
      if (newItem.availability.status === 'active') {
        inventoryStats[module].active_items++;
      } else {
        inventoryStats[module].draft_items++;
      }
    }
    
    res.status(201).json({
      success: true,
      data: newItem,
      message: 'Inventory item created successfully'
    });
  } catch (error) {
    console.error('Error creating extranet inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/admin/extranet/inventory/:id
 * @desc Update extranet inventory item
 * @access Admin
 */
router.put('/inventory/:id', requireAdmin, auditLog('extranet_update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const itemIndex = inventory.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const currentItem = inventory[itemIndex];
    const updatedItem = {
      ...currentItem,
      ...updateData,
      metadata: {
        ...currentItem.metadata,
        updated_at: new Date().toISOString(),
        updated_by: req.user.username
      }
    };
    
    inventory[itemIndex] = updatedItem;
    
    res.json({
      success: true,
      data: updatedItem,
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    console.error('Error updating extranet inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/admin/extranet/inventory/:id
 * @desc Delete extranet inventory item
 * @access Admin
 */
router.delete('/inventory/:id', requireAdmin, auditLog('extranet_delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const itemIndex = inventory.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const deletedItem = inventory[itemIndex];
    inventory.splice(itemIndex, 1);
    
    // Update stats
    const module = deletedItem.module;
    if (inventoryStats[module]) {
      inventoryStats[module].total_items--;
      if (deletedItem.availability.status === 'active') {
        inventoryStats[module].active_items--;
      } else {
        inventoryStats[module].draft_items--;
      }
    }
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting extranet inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message
    });
  }
});

/**
 * @route PATCH /api/admin/extranet/inventory/:id/toggle-status
 * @desc Toggle inventory item status (active/inactive)
 * @access Admin
 */
router.patch('/inventory/:id/toggle-status', requireAdmin, auditLog('extranet_toggle'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const itemIndex = inventory.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    const item = inventory[itemIndex];
    const oldStatus = item.availability.status;
    const newStatus = oldStatus === 'active' ? 'inactive' : 'active';
    
    item.availability.status = newStatus;
    item.metadata.updated_at = new Date().toISOString();
    item.metadata.updated_by = req.user.username;
    
    // Update stats
    const module = item.module;
    if (inventoryStats[module]) {
      if (oldStatus === 'active' && newStatus === 'inactive') {
        inventoryStats[module].active_items--;
      } else if (oldStatus === 'inactive' && newStatus === 'active') {
        inventoryStats[module].active_items++;
      }
    }
    
    res.json({
      success: true,
      data: item,
      message: `Inventory item ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling extranet inventory status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle inventory status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/extranet/inventory/:id
 * @desc Get single extranet inventory item
 * @access Admin
 */
router.get('/inventory/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = inventory.find(item => item.id === id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching extranet inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/extranet/bulk-import
 * @desc Bulk import inventory items from CSV
 * @access Admin
 */
router.post('/bulk-import', requireAdmin, auditLog('extranet_bulk_import'), async (req, res) => {
  try {
    const { items, module } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }
    
    const imported = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        const newItem = {
          id: `inv_${Date.now()}_${i}`,
          module: module || item.module,
          title: item.title,
          description: item.description,
          location: item.location,
          pricing: {
            basePrice: parseFloat(item.price) || 0,
            currency: item.currency || 'INR',
            priceType: item.priceType || 'per_person'
          },
          availability: {
            status: item.status || 'draft',
            capacity: parseInt(item.capacity) || 10,
            availableSlots: parseInt(item.capacity) || 10
          },
          details: {
            includes: item.includes ? item.includes.split(',').map(s => s.trim()) : [],
            excludes: item.excludes ? item.excludes.split(',').map(s => s.trim()) : [],
            highlights: item.highlights ? item.highlights.split(',').map(s => s.trim()) : []
          },
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: req.user.username,
            source: 'extranet'
          }
        };
        
        inventory.push(newItem);
        imported.push(newItem);
        
        // Update stats
        const itemModule = newItem.module;
        if (inventoryStats[itemModule]) {
          inventoryStats[itemModule].total_items++;
          if (newItem.availability.status === 'active') {
            inventoryStats[itemModule].active_items++;
          } else {
            inventoryStats[itemModule].draft_items++;
          }
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        imported: imported.length,
        errors: errors.length,
        items: imported,
        errorDetails: errors
      },
      message: `Successfully imported ${imported.length} items${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error('Error bulk importing extranet inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import inventory',
      error: error.message
    });
  }
});

module.exports = router;
