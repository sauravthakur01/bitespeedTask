import { Router } from 'express';
import { IdentityController } from '../controllers/identityController';
import { IdentityService } from '../services/identityService';

const router = Router();
const identityService = new IdentityService();
const identityController = new IdentityController(identityService);

router.post('/identify', (req, res) => identityController.identify(req, res));

export default router;