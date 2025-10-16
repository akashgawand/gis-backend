import express from 'express';
import { 
  createGeometry, 
  getAllGeometries, 
  getGeometryById, 
  updateGeometry, 
  deleteGeometry,
  getGeometryStats
} from '../controllers/geometryController.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, checkPermission('create'), createGeometry);
router.get('/', verifyToken, checkPermission('read'), getAllGeometries);
router.get('/stats', verifyToken, checkPermission('read'), getGeometryStats);
router.get('/:id', verifyToken, checkPermission('read'), getGeometryById);
router.put('/:id', verifyToken, checkPermission('update'), updateGeometry);
router.delete('/:id', verifyToken, checkPermission('delete'), deleteGeometry);

export default router;
