const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTicket,
  getTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  getTicketStats,
} = require('../controllers/supportTicketController');

// All routes require authentication
router.use(protect);

// Stats must come before :id to avoid conflict
router.get('/stats', getTicketStats);

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.get('/:id', getTicketById);
router.post('/:id/reply', replyToTicket);
router.put('/:id/status', updateTicketStatus);

module.exports = router;
