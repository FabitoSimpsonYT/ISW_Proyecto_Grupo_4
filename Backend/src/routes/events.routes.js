import express from 'express';
import { 
  createEvent, 
  getEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent 
} from '../controllers/eventController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { createEventSchema, updateEventSchema } from '../validators/eventValidator.js';

const router = express.Router();

router.route('/')
  .get(protect, getEvents)
  .post(
    protect, 
    authorize('profesor', 'coordinador', 'jefe_carrera'), 
    validate(createEventSchema), 
    createEvent
  );

router.route('/:id')
  .get(protect, getEvent)
  .put(
    protect, 
    authorize('profesor', 'coordinador', 'jefe_carrera'), 
    validate(updateEventSchema), 
    updateEvent
  )
  .delete(
    protect, 
    authorize('profesor', 'coordinador', 'jefe_carrera'), 
    deleteEvent
  );

export default router;