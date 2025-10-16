import express from 'express';
import { getAllRoles, createRole, updateRole, deleteRole } from '../controllers/roleController.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, checkPermission('read'), getAllRoles);
router.post('/', verifyToken, checkPermission('create'), createRole);
router.put('/:id', verifyToken, checkPermission('update'), updateRole);
router.delete('/:id', verifyToken, checkPermission('delete'), deleteRole);

export default router;
