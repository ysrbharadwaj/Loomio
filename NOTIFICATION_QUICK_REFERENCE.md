# Notification System - Quick Reference Guide

## 🎯 At a Glance

### What Gets Notified?

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 TASKS                                                   │
│  ├─ Create      → All Members                              │
│  ├─ Assign      → Assigned Users                           │
│  ├─ Self-Assign → Admins                                   │
│  ├─ Submit      → Admins (High Priority)                   │
│  ├─ Approve     → Assignees (High Priority)                │
│  ├─ Reject      → Assignees (High Priority + Reason)       │
│  ├─ Update      → Assignees                                │
│  └─ Delete      → Assignees                                │
│                                                             │
│  📅 EVENTS                                                  │
│  ├─ Create      → All Members                              │
│  └─ Update      → All Members                              │
│                                                             │
│  👥 COMMUNITY                                               │
│  ├─ Join        → Admins (Low Priority)                    │
│  └─ Leave       → Admins (Low Priority)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Visual Design

### Notification Icons & Colors

```
┌──────────────────────────────────────────────────────┐
│  Icon Color Guide                                    │
├──────────────────────────────────────────────────────┤
│  🔵 Blue       - Task Created                        │
│  🟣 Purple     - Task Assigned                       │
│  🔷 Indigo     - Task Self-Assigned                  │
│  🟡 Yellow     - Task Submitted                      │
│  🟢 Green      - Task Approved/Completed             │
│  🔴 Red        - Task Rejected                       │
│  ⚪ Gray       - Task Updated/Deleted                │
│  🔷 Teal       - Events                              │
│  🔵 Cyan       - Community                           │
└──────────────────────────────────────────────────────┘
```

### Priority Badges

```
⚡ High Priority    - Red badge, urgent attention
🔵 Medium Priority  - No badge (default)
📌 Low Priority     - Gray badge, informational
```

## 📱 User Interface Features

### Filters
- **All** - Show all notifications
- **Unread** - Show only unread notifications  
- **Read** - Show only read notifications

### Actions
- ✅ **Mark as Read** - Mark individual notification
- ✅ **Mark All Read** - Mark all unread notifications
- 🗑️ **Delete** - Remove notification
- 👁️ **View** - Click to see details

### Visual Indicators
- 🔵 **Blue Background** - Unread notification
- 📍 **Left Border** - New notification indicator
- 🔔 **"New" Badge** - Recently received
- ⚡ **Priority Badge** - High/Low priority items

## 🔔 Notification Messages

### Task Examples

#### Task Created
```
Title: New Task Available
Message: A new task "Update Documentation" has been created 
         by John Doe in Tech Community.
```

#### Task Assigned
```
Title: Task Assigned
Message: You have been assigned to task "Fix Bug #123" 
         by Jane Smith in Dev Team.
```

#### Task Self-Assigned
```
Title: Task Self-Assigned
Message: John Doe has self-assigned to task "Code Review" 
         in Tech Community.
```

#### Task Submitted
```
Title: Task Submitted for Review
Message: Jane Smith has submitted task "Design Mockup" 
         for review in Design Team.
```

#### Task Approved
```
Title: Task Approved
Message: Congratulations! Your submission for task 
         "Write Blog Post" has been approved by Admin 
         in Marketing Team.
```

#### Task Rejected
```
Title: Task Rejected
Message: Your submission for task "Update Logo" has been 
         rejected by Admin in Design Team. 
         Reason: Please use higher resolution assets.
```

### Event Examples

#### Event Created
```
Title: New Event Created
Message: A new event "Team Meeting" has been scheduled 
         by Manager in Tech Community.
```

#### Event Updated
```
Title: Event Updated
Message: Event "Quarterly Review" has been updated 
         by Admin in Company.
```

### Community Examples

#### Member Joined
```
Title: New Member Joined
Message: Sarah Johnson has joined Tech Community.
```

#### Member Left
```
Title: Member Left
Message: Mike Brown has left Tech Community.
```

## 🔌 API Quick Reference

```javascript
// Get notifications
GET /api/notifications?page=1&limit=20&is_read=false

// Mark as read
PUT /api/notifications/:id/read

// Mark all as read
PUT /api/notifications/read-all

// Delete notification
DELETE /api/notifications/:id

// Get unread count
GET /api/notifications/count
```

## 💡 Pro Tips

### For Users
1. Check notifications regularly to stay updated
2. Mark important notifications as read after acting on them
3. Use filters to focus on unread items
4. Watch for high-priority notifications (red badge)
5. Community name shows where the activity happened

### For Admins
6. Self-assignment notifications help track volunteer activity
7. Submission notifications are high priority - review promptly
8. Member activity helps monitor community growth
9. Task update notifications keep assignees informed

### For Developers
10. Notifications are async - won't block operations
11. Errors are logged but don't stop main functions
12. Bulk notifications for efficiency
13. All notifications include community context
14. Priority levels help users focus on important items

## 🚀 Quick Start

### Backend Setup
```bash
# Run database migration
mysql -u user -p database < backend/migrations/update-notification-types.sql

# Restart server
cd backend && npm start
```

### Test Notifications
```bash
# 1. Create a task → Members get notified
# 2. Self-assign → Admins get notified  
# 3. Submit task → Admins get notified
# 4. Approve/Reject → Assignees get notified
```

## 📊 Notification Statistics

| Type | Who Gets Notified | Priority | Icon |
|------|-------------------|----------|------|
| Task Created | All Members | Medium/High | 🔵 |
| Task Assigned | Assignees | Medium/High | 🟣 |
| Task Self-Assigned | Admins | Medium | 🔷 |
| Task Submitted | Admins | High | 🟡 |
| Task Approved | Assignees | High | 🟢 |
| Task Rejected | Assignees | High | 🔴 |
| Task Updated | Assignees | Medium | ⚪ |
| Task Deleted | Assignees | Medium | ⚪ |
| Event Created | All Members | Medium | 🔷 |
| Event Updated | All Members | Medium | 🔷 |
| Member Joined | Admins | Low | 🔵 |
| Member Left | Admins | Low | 🔵 |

---

**🎉 Your notification system is ready!**
All community activities now trigger professional, timely notifications to keep everyone informed and engaged.
