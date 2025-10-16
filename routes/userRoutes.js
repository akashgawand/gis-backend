import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import { verifyToken, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, checkPermission('read'), getAllUsers);
router.get('/:id', verifyToken, checkPermission('read'), getUserById);
router.put('/:id', verifyToken, checkPermission('update'), updateUser);
router.delete('/:id', verifyToken, checkPermission('delete'), deleteUser);

export default router;
