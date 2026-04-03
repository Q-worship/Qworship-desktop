import { Router } from 'express';
import { createOrganization, selectPlan } from './organization.controller.js';

export const organizationRouter = Router();

organizationRouter.post('/organizations', createOrganization);
organizationRouter.post('/plans/select', selectPlan);
