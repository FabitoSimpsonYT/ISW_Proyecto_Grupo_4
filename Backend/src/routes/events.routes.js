import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/event.controller.js';
import { injectEntityIds, auth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createEventSchema, updateEventSchema } from '../validations/event.validation.js';

const router = express.Router();

router.route('/')
  .get(injectEntityIds, getEvents)
  .post(
    injectEntityIds, 
    auth, 
    validateRequest(createEventSchema), 
    createEvent
  );

router.route('/:id')
  .get(injectEntityIds, getEvent)
  .put(
    injectEntityIds, 
    auth, 
    validateRequest(updateEventSchema), 
    updateEvent
  )
  .delete(
    injectEntityIds, 
    auth, //quitar lo de roles como profesor, coordinador y jefe de carrera, agregar y modificar middleware
    deleteEvent
  );

export default router;