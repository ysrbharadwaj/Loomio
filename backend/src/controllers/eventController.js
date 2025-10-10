const { Event, User, Community } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      event_type = '', 
      community_id = '',
      search = '',
      status = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by community if user is not platform admin
    if (req.user.role !== 'platform_admin') {
      whereClause.community_id = req.user.community_id;
    } else if (community_id) {
      whereClause.community_id = community_id;
    }

    if (event_type) {
      whereClause.event_type = event_type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const events = await Event.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'ASC']]
    });

    res.json({
      events: events.rows,
      pagination: {
        total: events.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(events.count / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && event.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json({ event: event.toJSON() });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      end_date,
      location,
      event_type = 'meeting',
      max_attendees,
      is_public = true
    } = req.body;

    const created_by = req.user.user_id;
    const community_id = req.user.community_id;

    if (!community_id) {
      return res.status(400).json({ message: 'You must be a member of a community to create events' });
    }

    // Create event
    const event = await Event.create({
      title,
      description,
      date: new Date(date),
      end_date: end_date ? new Date(end_date) : null,
      location,
      event_type,
      max_attendees,
      is_public,
      created_by,
      community_id
    });

    // Get created event with relations
    const createdEvent = await Event.findByPk(event.event_id, {
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    // Notify community members about the new event
    try {
      await notificationService.notifyEventCreated(
        event,
        req.user.full_name,
        createdEvent.community.name
      );
    } catch (notifError) {
      console.error('Error sending event creation notification:', notifError);
    }

    res.status(201).json({
      message: 'Event created successfully',
      event: createdEvent.toJSON()
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      date, 
      end_date,
      location,
      event_type,
      max_attendees,
      is_public,
      status
    } = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && event.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Update event
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (end_date !== undefined) updateData.end_date = end_date ? new Date(end_date) : null;
    if (location !== undefined) updateData.location = location;
    if (event_type !== undefined) updateData.event_type = event_type;
    if (max_attendees !== undefined) updateData.max_attendees = max_attendees;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (status !== undefined) updateData.status = status;

    await event.update(updateData);

    // Get updated event with relations
    const updatedEvent = await Event.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    // Notify community members about the event update
    try {
      await notificationService.notifyEventUpdated(
        updatedEvent,
        req.user.full_name,
        updatedEvent.community.name
      );
    } catch (notifError) {
      console.error('Error sending event update notification:', notifError);
    }

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent.toJSON()
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && event.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Delete event
    await event.destroy();

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};
