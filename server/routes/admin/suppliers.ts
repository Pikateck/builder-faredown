import express from 'express';
import { AuthenticatedRequest, requirePermission, Permission } from '../../middleware/adminAuth';
import { sendSuccess } from '../../utils/adminUtils';

const router = express.Router();

// Re-export existing suppliers functionality for admin context
router.get('/', requirePermission(Permission.VIEW_SUPPLIERS), async (req: AuthenticatedRequest, res) => {
  // This will proxy to the existing /api/suppliers endpoint
  try {
    const suppliersResponse = await fetch('http://localhost:8080/api/suppliers');
    const suppliersData = await suppliersResponse.json();
    sendSuccess(res, suppliersData.data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
});

export default router;
