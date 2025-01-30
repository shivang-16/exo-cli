import { Router } from 'express';
import { your_controller } from '../controllers/controller-name';

const router = Router();

// Example route
router.get('/', your_controller);

export default router;
