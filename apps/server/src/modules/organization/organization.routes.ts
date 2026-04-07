import { Router } from 'express';
import { createOrganization, selectPlan, getOrganization, updateOrganization } from './organization.controller.js';

export const organizationRouter = Router();

organizationRouter.post('/organizations', createOrganization);
organizationRouter.post('/plans/select', selectPlan);
organizationRouter.get('/organization/:id', getOrganization);
organizationRouter.put('/organization/:id', updateOrganization);
