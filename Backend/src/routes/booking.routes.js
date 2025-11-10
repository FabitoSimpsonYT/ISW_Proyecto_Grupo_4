import express from 'express';
import { 
  createBooking, 
  getBookings, 
  getBooking, 
  updateBooking,
  cancelBooking 
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { createBookingSchema, updateBookingSchema } from '../validators/bookingValidator.js';

const router = express.Router();

router.route('/')
  .get(protect, getBookings)
  .post(
    protect, 
    authorize('alumno'), 
    validate(createBookingSchema), 
    createBooking
  );

router.route('/:id')
  .get(protect, getBooking)
  .put(protect, validate(updateBookingSchema), updateBooking);

router.put('/:id/cancel', protect, cancelBooking);

export default router;