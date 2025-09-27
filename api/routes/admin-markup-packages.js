const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

// Wrapper function for backward compatibility
const auditLog = (action) => async (req, res, next) => {
  try {
    await audit.adminAction(req, action, {});
    next();
  } catch (error) {
    console.error('Audit logging error:', error);
    next(); // Continue even if audit fails
  }
};

// Load comprehensive seed data
const { loadSeedData } = require('../scripts/seed-admin-data');
const seedData = loadSeedData();

// Mock database for markup rules
let markupRules = seedData.markupRules.filter(rule => rule.module === 'packages') || [
  {
    id: "rule_001",
    name: "Luxury Package Markup",
    description: "Premium markup for luxury packages",
    category: "luxury",
    ruleType: "percentage",
    value: 25,
    minValue: null,
    maxValue: 50000,
    conditions: {
      packageCategory: ["luxury"],
      priceRange: { min: 50000, max: 500000 },
      seasonality: "regular",
      region: ["Middle East", "Europe"]
    },
    priority: 1,
    isActive: true,
    appliesTo: "all",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:45:00Z",
    usage: {
      totalApplications: 156,
      revenue: 2840000,
      avgMarkup: 23.5
    }
  },
  {
    id: "rule_002",
    name: "Peak Season Boost",
    description: "Additional markup during peak travel seasons",
    ruleType: "percentage",
    value: 15,
    conditions: {
      seasonality: "peak",
      advanceBooking: 30
    },
    priority: 2,
    isActive: true,
    appliesTo: "all",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T16:30:00Z",
    usage: {
      totalApplications: 89,
      revenue: 1650000,
      avgMarkup: 14.8
    }
  },
  {
    id: "rule_003",
    name: "Early Bird Discount",
    description: "Reduced markup for early bookings",
    ruleType: "percentage",
    value: -5, // Negative value for discount
    conditions: {
      advanceBooking: 90
    },
    priority: 3,
    isActive: true,
    appliesTo: "all",
    createdAt: "2024-01-12T11:20:00Z",
    updatedAt: "2024-01-25T13:45:00Z",
    usage: {
      totalApplications: 67,
      revenue: -450000, // Negative revenue (discount)
      avgMarkup: -4.2
    }
  }
];

let markupStats = {
  totalRules: 12,
  activeRules: 8,
  totalRevenue: 4890000,
  avgMarkupPercentage: 18.6,
  topPerformingRule: "Luxury Package Markup",
  recentApplications: 245
};

/**
 * @route GET /api/admin/markup/packages
 * @desc Get package markup rules with filtering
 * @access Admin
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    
    let filteredRules = [...markupRules];
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRules = filteredRules.filter(rule => 
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (category && category !== 'all') {
      filteredRules = filteredRules.filter(rule => 
        rule.category === category || 
        (rule.conditions?.packageCategory && rule.conditions.packageCategory.includes(category))
      );
    }
    
    // Filter by status
    if (status && status !== 'all') {
      const isActive = status === 'active';
      filteredRules = filteredRules.filter(rule => rule.isActive === isActive);
    }
    
    // Sort by priority
    filteredRules.sort((a, b) => a.priority - b.priority);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRules = filteredRules.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        rules: paginatedRules,
        pagination: {
          total: filteredRules.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(filteredRules.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching package markup rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch markup rules',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/markup/packages/stats
 * @desc Get package markup statistics
 * @access Admin
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Calculate real-time stats from rules
    const totalRules = markupRules.length;
    const activeRules = markupRules.filter(rule => rule.isActive).length;
    const totalRevenue = markupRules.reduce((sum, rule) => sum + rule.usage.revenue, 0);
    const totalApplications = markupRules.reduce((sum, rule) => sum + rule.usage.totalApplications, 0);
    const avgMarkupPercentage = totalApplications > 0 
      ? markupRules.reduce((sum, rule) => sum + (rule.usage.avgMarkup * rule.usage.totalApplications), 0) / totalApplications
      : 0;
    
    // Find top performing rule
    const topRule = markupRules.reduce((top, rule) => 
      rule.usage.revenue > (top?.usage.revenue || 0) ? rule : top, null
    );
    
    const stats = {
      totalRules,
      activeRules,
      totalRevenue,
      avgMarkupPercentage: Math.round(avgMarkupPercentage * 10) / 10,
      topPerformingRule: topRule?.name || "None",
      recentApplications: totalApplications
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching package markup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch markup statistics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/markup/packages
 * @desc Create new package markup rule
 * @access Admin
 */
router.post('/', requireAdmin, async (req, res, next) => { await audit.adminAction(req, 'markup_create', {}); next(); }, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      ruleType,
      value,
      minValue,
      maxValue,
      conditions,
      priority,
      isActive,
      appliesTo,
      tieredMarkups
    } = req.body;
    
    // Validation
    if (!name || !description || !ruleType || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, ruleType, value'
      });
    }
    
    // Check for duplicate priority
    const existingPriority = markupRules.find(rule => rule.priority === priority && rule.isActive);
    if (existingPriority) {
      return res.status(400).json({
        success: false,
        message: `Priority ${priority} is already in use by another active rule`
      });
    }
    
    const newRule = {
      id: `rule_${Date.now()}`,
      name,
      description,
      category,
      ruleType,
      value: parseFloat(value),
      minValue: minValue ? parseFloat(minValue) : null,
      maxValue: maxValue ? parseFloat(maxValue) : null,
      conditions: conditions || {},
      priority: parseInt(priority) || 1,
      isActive: isActive !== false,
      appliesTo: appliesTo || "all",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: {
        totalApplications: 0,
        revenue: 0,
        avgMarkup: 0
      }
    };
    
    // Add tiered markups if applicable
    if (ruleType === 'tiered' && Array.isArray(tieredMarkups)) {
      newRule.tieredMarkups = tieredMarkups;
    }
    
    markupRules.push(newRule);
    
    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Markup rule created successfully'
    });
  } catch (error) {
    console.error('Error creating package markup rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create markup rule',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/admin/markup/packages/:id
 * @desc Update package markup rule
 * @access Admin
 */
router.put('/:id', requireAdmin, auditLog('markup_update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const ruleIndex = markupRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Markup rule not found'
      });
    }
    
    const currentRule = markupRules[ruleIndex];
    
    // Check for duplicate priority if it's being changed
    if (updateData.priority && updateData.priority !== currentRule.priority) {
      const existingPriority = markupRules.find(rule => 
        rule.id !== id && rule.priority === updateData.priority && rule.isActive
      );
      if (existingPriority) {
        return res.status(400).json({
          success: false,
          message: `Priority ${updateData.priority} is already in use by another active rule`
        });
      }
    }
    
    const updatedRule = {
      ...currentRule,
      ...updateData,
      id: currentRule.id, // Ensure ID cannot be changed
      usage: currentRule.usage, // Preserve usage stats
      createdAt: currentRule.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    markupRules[ruleIndex] = updatedRule;
    
    res.json({
      success: true,
      data: updatedRule,
      message: 'Markup rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating package markup rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update markup rule',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/admin/markup/packages/:id
 * @desc Delete package markup rule
 * @access Admin
 */
router.delete('/:id', requireAdmin, auditLog('markup_delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const ruleIndex = markupRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Markup rule not found'
      });
    }
    
    const deletedRule = markupRules[ruleIndex];
    markupRules.splice(ruleIndex, 1);
    
    res.json({
      success: true,
      message: 'Markup rule deleted successfully',
      data: { deletedRule: deletedRule.name }
    });
  } catch (error) {
    console.error('Error deleting package markup rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete markup rule',
      error: error.message
    });
  }
});

/**
 * @route PATCH /api/admin/markup/packages/:id/toggle
 * @desc Toggle markup rule status (active/inactive)
 * @access Admin
 */
router.patch('/:id/toggle', requireAdmin, auditLog('markup_toggle'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const ruleIndex = markupRules.findIndex(rule => rule.id === id);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Markup rule not found'
      });
    }
    
    const rule = markupRules[ruleIndex];
    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: rule,
      message: `Markup rule ${rule.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling package markup rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle markup rule',
      error: error.message
    });
  }
});

/**
 * @route GET /api/admin/markup/packages/:id
 * @desc Get single package markup rule
 * @access Admin
 */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = markupRules.find(rule => rule.id === id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Markup rule not found'
      });
    }
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching package markup rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch markup rule',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/markup/packages/calculate
 * @desc Calculate markup for given package details
 * @access Admin
 */
router.post('/calculate', requireAdmin, async (req, res) => {
  try {
    const {
      basePrice,
      currency = 'INR',
      packageCategory,
      region,
      seasonality,
      advanceBooking,
      groupSize
    } = req.body;
    
    if (!basePrice || basePrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid base price is required'
      });
    }
    
    // Get applicable rules sorted by priority
    const applicableRules = markupRules
      .filter(rule => rule.isActive)
      .filter(rule => {
        const conditions = rule.conditions || {};
        
        // Check package category
        if (conditions.packageCategory && conditions.packageCategory.length > 0) {
          if (!packageCategory || !conditions.packageCategory.includes(packageCategory)) {
            return false;
          }
        }
        
        // Check region
        if (conditions.region && conditions.region.length > 0) {
          if (!region || !conditions.region.includes(region)) {
            return false;
          }
        }
        
        // Check price range
        if (conditions.priceRange) {
          if (conditions.priceRange.min && basePrice < conditions.priceRange.min) {
            return false;
          }
          if (conditions.priceRange.max && basePrice > conditions.priceRange.max) {
            return false;
          }
        }
        
        // Check seasonality
        if (conditions.seasonality && seasonality !== conditions.seasonality) {
          return false;
        }
        
        // Check advance booking
        if (conditions.advanceBooking && (!advanceBooking || advanceBooking < conditions.advanceBooking)) {
          return false;
        }
        
        // Check group size
        if (conditions.groupSize) {
          if (conditions.groupSize.min && (!groupSize || groupSize < conditions.groupSize.min)) {
            return false;
          }
          if (conditions.groupSize.max && (!groupSize || groupSize > conditions.groupSize.max)) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => a.priority - b.priority);
    
    let finalPrice = basePrice;
    let appliedRules = [];
    
    // Apply first matching rule (highest priority)
    if (applicableRules.length > 0) {
      const rule = applicableRules[0];
      let markupAmount = 0;
      
      if (rule.ruleType === 'percentage') {
        markupAmount = (basePrice * rule.value) / 100;
        if (rule.maxValue && markupAmount > rule.maxValue) {
          markupAmount = rule.maxValue;
        }
        if (rule.minValue && markupAmount < rule.minValue) {
          markupAmount = rule.minValue;
        }
      } else if (rule.ruleType === 'fixed') {
        markupAmount = rule.value;
      } else if (rule.ruleType === 'tiered' && rule.tieredMarkups) {
        // Find applicable tier
        const tier = rule.tieredMarkups.find(t => 
          basePrice >= t.minPrice && basePrice <= t.maxPrice
        );
        if (tier) {
          markupAmount = (basePrice * tier.markupPercentage) / 100;
        }
      }
      
      finalPrice = basePrice + markupAmount;
      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        markupAmount: Math.round(markupAmount * 100) / 100,
        markupPercentage: Math.round((markupAmount / basePrice) * 100 * 10) / 10
      });
    }
    
    res.json({
      success: true,
      data: {
        basePrice,
        finalPrice: Math.round(finalPrice * 100) / 100,
        totalMarkup: Math.round((finalPrice - basePrice) * 100) / 100,
        markupPercentage: Math.round(((finalPrice - basePrice) / basePrice) * 100 * 10) / 10,
        currency,
        appliedRules,
        applicableRulesCount: applicableRules.length
      }
    });
  } catch (error) {
    console.error('Error calculating package markup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate markup',
      error: error.message
    });
  }
});

/**
 * @route POST /api/admin/markup/packages/bulk-import
 * @desc Bulk import markup rules from CSV
 * @access Admin
 */
router.post('/bulk-import', requireAdmin, auditLog('markup_bulk_import'), async (req, res) => {
  try {
    const { rules } = req.body;
    
    if (!Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rules array is required and must not be empty'
      });
    }
    
    const imported = [];
    const errors = [];
    
    for (let i = 0; i < rules.length; i++) {
      try {
        const rule = rules[i];
        const newRule = {
          id: `rule_${Date.now()}_${i}`,
          name: rule.name,
          description: rule.description || '',
          category: rule.category,
          ruleType: rule.ruleType || 'percentage',
          value: parseFloat(rule.value) || 0,
          minValue: rule.minValue ? parseFloat(rule.minValue) : null,
          maxValue: rule.maxValue ? parseFloat(rule.maxValue) : null,
          conditions: rule.conditions || {},
          priority: parseInt(rule.priority) || (markupRules.length + i + 1),
          isActive: rule.isActive !== false,
          appliesTo: rule.appliesTo || "all",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          usage: {
            totalApplications: 0,
            revenue: 0,
            avgMarkup: 0
          }
        };
        
        markupRules.push(newRule);
        imported.push(newRule);
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
        rules: imported,
        errorDetails: errors
      },
      message: `Successfully imported ${imported.length} rules${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error('Error bulk importing package markup rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk import markup rules',
      error: error.message
    });
  }
});

module.exports = router;
