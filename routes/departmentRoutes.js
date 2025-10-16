import express from 'express';
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, checkPermission('read'), getAllDepartments);
router.post('/', verifyToken, checkPermission('create'), createDepartment);
router.put('/:id', verifyToken, checkPermission('update'), updateDepartment);
router.delete('/:id', verifyToken, checkPermission('delete'), deleteDepartment);

export default router;
