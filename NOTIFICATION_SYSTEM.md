# Notification System Documentation

## Overview
The Loomio platform now includes a comprehensive notification system that keeps users informed about all community activities, task updates, events, and member activities.

## Features

### Notification Types

#### Task Notifications
1. **Task Created** (`task_created`)
   - Sent to: All community members (except creator)
   - Triggered when: A new task is created
   - Priority: Based on task priority (high/medium/low)

2. **Task Assigned** (`task_assigned`)
   - Sent to: Assigned users
   - Triggered when: Users are assigned to a task by an admin
   - Priority: Based on task priority

3. **Task Self-Assigned** (`task_self_assigned`)
   - Sent to: All community admins
   - Triggered when: A user self-assigns to an available task
   - Priority: Medium

4. **Task Submitted** (`task_submitted`)
   - Sent to: All community admins
   - Triggered when: A user submits a task for review
   - Priority: High

5. **Task Approved** (`task_approved`)
   - Sent to: All task assignees
   - Triggered when: An admin approves a submitted task
   - Priority: High

6. **Task Rejected** (`task_rejected`)
   - Sent to: All task assignees
   - Triggered when: An admin rejects a submitted task
   - Priority: High
   - Includes: Rejection reason/notes

7. **Task Updated** (`task_updated`)
   - Sent to: All task assignees
   - Triggered when: A task is modified by an admin
   - Priority: Medium

8. **Task Deleted** (`task_deleted`)
   - Sent to: All task assignees
   - Triggered when: A task is deleted
   - Priority: Medium

#### Event Notifications
1. **Event Created** (`event_created`)
   - Sent to: All community members (except creator)
   - Triggered when: A new event is scheduled
   - Priority: Medium

2. **Event Updated** (`event_updated`)
   - Sent to: All community members
   - Triggered when: An event is modified
   - Priority: Medium

#### Community Notifications
1. **Member Joined** (`community_member_joined`)
   - Sent to: All community admins
   - Triggered when: A new member joins the community
   - Priority: Low

2. **Member Left** (`community_member_left`)
   - Sent to: All community admins
   - Triggered when: A member leaves the community
   - Priority: Low

## Technical Implementation

### Backend Structure

#### Notification Model
Location: `backend/src/models/Notification.js`

Fields:
- `notification_id`: Primary key
- `user_id`: Recipient user ID
- `title`: Notification title
- `message`: Detailed notification message
- `type`: Notification type (enum)
- `is_read`: Read status (boolean)
- `read_at`: Timestamp when marked as read
- `related_id`: ID of related entity (task, event, etc.)
- `related_type`: Type of related entity
- `priority`: Priority level (high/medium/low)
- `community_id`: Associated community ID

#### Notification Service
Location: `backend/src/services/notificationService.js`

Key Functions:
- `createNotification()`: Create a single notification
- `createBulkNotifications()`: Create multiple notifications
- `getCommunityAdmins()`: Get all admins of a community
- `getCommunityMembers()`: Get all members of a community
- `notifyTaskCreated()`: Task creation notifications
- `notifyTaskAssigned()`: Task assignment notifications
- `notifyTaskSelfAssigned()`: Self-assignment notifications
- `notifyTaskSubmitted()`: Task submission notifications
- `notifyTaskApproved()`: Task approval notifications
- `notifyTaskRejected()`: Task rejection notifications
- `notifyTaskUpdated()`: Task update notifications
- `notifyTaskDeleted()`: Task deletion notifications
- `notifyEventCreated()`: Event creation notifications
- `notifyEventUpdated()`: Event update notifications
- `notifyMemberJoined()`: Member join notifications
- `notifyMemberLeft()`: Member leave notifications

#### Controllers Integration
The notification service is integrated into:
- `taskController.js`: All task-related operations
- `eventController.js`: Event creation and updates
- `communityController.js`: Member join/leave operations

### Frontend Structure

#### Notifications Page
Location: `frontend/src/pages/Notifications.jsx`

Features:
- Filter by status: All, Unread, Read
- Visual indicators for unread notifications
- Priority badges for high/low priority items
- Icon-based notification categorization
- Mark as read/delete individual notifications
- Mark all as read functionality
- Time-ago formatting for timestamps
- Community name display

#### Visual Design
- **Unread notifications**: Blue background with left border accent
- **Read notifications**: White background
- **Icons**: Color-coded by notification type
  - Task Created: Blue
  - Task Assigned: Purple
  - Task Self-Assigned: Indigo
  - Task Submitted: Yellow
  - Task Approved: Green
  - Task Rejected: Red
  - Events: Teal
  - Community: Cyan

## Database Migration

To update your database with the new notification types, run:

```sql
-- For MySQL
ALTER TABLE notifications 
MODIFY COLUMN type ENUM(
  'task_created',
  'task_assigned', 
  'task_self_assigned',
  'task_submitted', 
  'task_approved', 
  'task_rejected',
  'task_updated',
  'task_deleted',
  'task_completed',
  'deadline_reminder', 
  'leave_approved', 
  'leave_rejected', 
  'event_created',
  'event_updated',
  'event_reminder', 
  'community_member_joined',
  'community_member_left',
  'general'
) NOT NULL;
```

## API Endpoints

### Get Notifications
```
GET /api/notifications
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 20)
  - is_read: Filter by read status (true/false)
  - type: Filter by notification type
```

### Mark Notification as Read
```
PUT /api/notifications/:id/read
```

### Mark All as Read
```
PUT /api/notifications/read-all
```

### Delete Notification
```
DELETE /api/notifications/:id
```

### Get Unread Count
```
GET /api/notifications/count
```

## Usage Examples

### Creating a Task Notification (Backend)
```javascript
const notificationService = require('../services/notificationService');

// After creating a task
await notificationService.notifyTaskCreated(
  task, 
  creatorName, 
  communityName
);
```

### Handling Notifications (Frontend)
```javascript
// Fetch notifications
const response = await api.get('/notifications?limit=50');
const notifications = response.data.notifications;

// Mark as read
await api.put(`/notifications/${notificationId}/read`);

// Delete notification
await api.delete(`/notifications/${notificationId}`);
```

## Best Practices

1. **Performance**: Notifications are created asynchronously to avoid blocking main operations
2. **Error Handling**: Notification failures don't stop primary operations
3. **User Experience**: Real-time updates keep users informed
4. **Privacy**: Users only see notifications for their communities
5. **Cleanup**: Consider implementing auto-deletion of old read notifications

## Future Enhancements

Potential improvements:
- Real-time notifications using WebSockets
- Email notifications for high-priority items
- Push notifications for mobile apps
- Notification preferences/settings
- Digest emails (daily/weekly summaries)
- In-app notification sounds
- Notification grouping/threading
- Custom notification rules per user

## Troubleshooting

### Notifications Not Appearing
1. Check database migration was run successfully
2. Verify user is member of the community
3. Check notification service error logs
4. Ensure API endpoints are accessible

### Performance Issues
1. Implement pagination (already included)
2. Add database indexes on `user_id` and `is_read`
3. Consider archiving old notifications
4. Optimize bulk notification creation

## Support

For issues or questions about the notification system:
1. Check the console logs for errors
2. Verify database connection and schema
3. Review API responses in network tab
4. Contact the development team
