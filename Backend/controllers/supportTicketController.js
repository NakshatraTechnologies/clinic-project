const SupportTicket = require('../models/SupportTicket');

/**
 * @desc    Create a new support ticket
 * @route   POST /api/support-tickets
 * @access  Private (patient, clinic_admin)
 */
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;
    const user = req.user;

    if (!['patient', 'clinic_admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Only patients and clinic admins can raise tickets.' });
    }

    const ticket = await SupportTicket.create({
      raisedBy: user._id,
      raisedByRole: user.role,
      clinicId: user.role === 'clinic_admin' ? user.clinicId : null,
      subject,
      category: category || 'general',
      priority: priority || 'medium',
      description,
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    console.error('Create Ticket Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get tickets (own for patient/clinic_admin, all for admin)
 * @route   GET /api/support-tickets
 * @access  Private
 */
const getTickets = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, status, priority, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};

    // Role-based filtering
    if (user.role === 'admin') {
      // Admin sees all tickets
    } else if (user.role === 'clinic_admin') {
      filter.raisedBy = user._id;
    } else if (user.role === 'patient') {
      filter.raisedBy = user._id;
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Optional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('raisedBy', 'name phone email role')
        .populate('clinicId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get Tickets Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get single ticket detail
 * @route   GET /api/support-tickets/:id
 * @access  Private
 */
const getTicketById = async (req, res) => {
  try {
    const user = req.user;
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('raisedBy', 'name phone email role')
      .populate('clinicId', 'name')
      .populate('messages.sender', 'name role');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Only owner or admin can view
    if (user.role !== 'admin' && ticket.raisedBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    console.error('Get Ticket Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Reply to a ticket (add message to thread)
 * @route   POST /api/support-tickets/:id/reply
 * @access  Private
 */
const replyToTicket = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Only owner or admin can reply
    if (user.role !== 'admin' && ticket.raisedBy.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    ticket.messages.push({
      sender: user._id,
      senderRole: user.role,
      message: message.trim(),
    });

    await ticket.save();

    // Re-populate for response
    const updated = await SupportTicket.findById(ticket._id)
      .populate('raisedBy', 'name phone email role')
      .populate('clinicId', 'name')
      .populate('messages.sender', 'name role');

    res.json({ success: true, ticket: updated });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    console.error('Reply Ticket Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update ticket status (admin only)
 * @route   PUT /api/support-tickets/:id/status
 * @access  Private (admin)
 */
const updateTicketStatus = async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.body;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can change ticket status.' });
    }

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.status = status;
    if (status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    const updated = await SupportTicket.findById(ticket._id)
      .populate('raisedBy', 'name phone email role')
      .populate('clinicId', 'name')
      .populate('messages.sender', 'name role');

    res.json({ success: true, ticket: updated });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    console.error('Update Status Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get ticket stats (counts by status) — admin only
 * @route   GET /api/support-tickets/stats
 * @access  Private (admin)
 */
const getTicketStats = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [open, in_progress, resolved, closed, total] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      SupportTicket.countDocuments({}),
    ]);

    res.json({
      success: true,
      stats: { open, in_progress, resolved, closed, total },
    });
  } catch (err) {
    console.error('Ticket Stats Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  getTicketStats,
};
