import express from 'express';
import { 
  createBooking, 
  getBookings, 
  getBooking, 
  updateBooking,
  cancelBooking 
} from '../controllers/booking.controller.js';
import { injectEntityIds, auth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { createBookingSchema, updateBookingSchema } from '../validations/booking.validation.js';

const router = express.Router();

router.route('/')
  .get(injectEntityIds, getBookings)
  .post(
    injectEntityIds, 
    auth, 
    validateRequest(createBookingSchema), 
    createBooking
  );

router.route('/:id')
  .get(injectEntityIds, getBooking)
  .put(injectEntityIds, validateRequest(updateBookingSchema), updateBooking);

router.put('/:id/cancel', injectEntityIds, cancelBooking);

export default router;