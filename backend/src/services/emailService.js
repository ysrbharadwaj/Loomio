const axios = require('axios');

/**
 * Email Service for sending notifications and alerts using Google Apps Script
 * Free, reliable, and uses Gmail to send emails
 */

// Apps Script Web App URL - will be deployed from your Google account
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

if (APPS_SCRIPT_URL) {
  console.log('Google Apps Script email service initialized');
} else {
  console.warn('APPS_SCRIPT_URL not set - email notifications disabled');
  console.warn('Follow docs/APPS-SCRIPT-EMAIL-SETUP.md to deploy the Apps Script');
}

/**
 * Send email using Google Apps Script
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!APPS_SCRIPT_URL) {
      console.warn('Email not sent - APPS_SCRIPT_URL not configured');
      return { success: false, error: 'Apps Script URL not configured' };
    }

    const response = await axios.post(APPS_SCRIPT_URL, {
      to,
      subject,
      html,
      text: text || stripHtml(html),
      from: process.env.EMAIL_FROM_NAME || 'Loomio'
    }, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.success) {
      console.log('Email sent successfully via Apps Script to:', to);
      return { success: true, messageId: response.data.messageId };
    } else {
      console.error('Apps Script email error:', response.data);
      return { success: false, error: response.data?.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #4f46e5; color: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #3730a3; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; background: white; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.8; }
        .feature-list { list-style: none; padding: 0; margin: 20px 0; }
        .feature-list li { padding: 12px 0; color: #4b5563; position: relative; padding-left: 30px; }
        .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 18px; }
        .button { display: inline-block; background: #4f46e5; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3); }
        .button:hover { background: #4338ca; }
        .info-box { background: #f9fafb; border-left: 4px solid #4f46e5; padding: 15px 20px; margin: 20px 0; border-radius: 4px; }
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
        .footer p { margin: 5px 0; }
        .footer strong { color: #d1d5db; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Loomio!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          <p>Thank you for joining <strong>Loomio</strong> - your community task management platform! We're excited to have you on board.</p>
          
          <p><strong>Here's what you can do:</strong></p>
          <ul class="feature-list">
            <li>Create and join communities</li>
            <li>Manage tasks and collaborate with your team</li>
            <li>Track contributions and earn recognition</li>
            <li>View analytics and insights</li>
            <li>Set up email notifications for important updates</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started Now</a>
          </div>
          
          <div class="info-box">
            <strong>Your Account Details:</strong><br>
            Email: ${user.email}
          </div>
          
          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
          <p>Happy collaborating!</p>
        </div>
        <div class="footer">
          <strong>Threads of Effort, Woven Into Outcomes</strong>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Loomio!',
    html
  });
};

/**
 * Send task assigned notification email (supports single or multiple assignees)
 */
const sendTaskAssignedEmail = async ({ user, task, assignedBy, community, isGroupTask = false, totalAssignees = 1 }) => {
  const priorityColors = {
    high: { bg: '#fee2e2', text: '#991b1b', icon: '🔴' },
    medium: { bg: '#fef3c7', text: '#92400e', icon: '🟡' },
    low: { bg: '#dbeafe', text: '#1e40af', icon: '🟢' }
  };
  
  const priority = task.priority || 'medium';
  const priorityStyle = priorityColors[priority] || priorityColors.medium;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #0f766e; color: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #0d5c55; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 40px 30px; background: white; }
        .content h2 { color: #1f2937; margin-top: 0; }
        .content p { color: #4b5563; line-height: 1.8; }
        .task-card { background: #f9fafb; border-left: 5px solid #0f766e; padding: 25px; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .task-card h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 22px; }
        .task-detail { margin: 12px 0; color: #4b5563; }
        .task-detail strong { color: #1f2937; display: inline-block; min-width: 100px; }
        .priority-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: ${priorityStyle.bg}; color: ${priorityStyle.text}; }
        .group-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #e0e7ff; color: #4338ca; margin-left: 8px; }
        .button { display: inline-block; background: #0f766e; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.3); }
        .button:hover { background: #0d5c55; }
        .highlight-box { background: #eff6ff; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
        .footer p { margin: 5px 0; }
        .footer strong { color: #d1d5db; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isGroupTask ? 'Group Task Assigned' : 'New Task Assigned'}</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          <p>You have been assigned to ${isGroupTask ? 'a group task' : 'a new task'} by <strong>${assignedBy.full_name || assignedBy}</strong> in the <strong>${community.name || community}</strong> community.</p>
          
          ${isGroupTask && totalAssignees > 1 ? `
          <div class="highlight-box">
            <strong>👥 Group Task:</strong> This task is assigned to ${totalAssignees} team members. Collaboration is key!
          </div>
          ` : ''}
          
          <div class="task-card">
            <h3>${task.title}</h3>
            ${task.description ? `<p style="color: #6b7280; margin: 15px 0;">${task.description}</p>` : ''}
            
            <div class="task-detail">
              <strong>Priority:</strong> 
              <span class="priority-badge">${priorityStyle.icon} ${priority.toUpperCase()}</span>
              ${isGroupTask ? '<span class="group-badge">👥 GROUP TASK</span>' : ''}
            </div>
            
            ${task.deadline ? `
            <div class="task-detail">
              <strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            ` : ''}
            
            <div class="task-detail">
              <strong>Points:</strong> 🏆 ${task.points || 0} points
            </div>
            
            ${task.category ? `
            <div class="task-detail">
              <strong>Category:</strong> ${task.category}
            </div>
            ` : ''}
          </div>
          
          <p>Click the button below to view task details and start working on it:</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/tasks/${task.task_id}" class="button">View Task Details</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            💡 <strong>Tip:</strong> You can manage your email preferences from your profile settings.
          </p>
        </div>
        <div class="footer">
          <strong>Threads of Effort, Woven Into Outcomes</strong>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: isGroupTask ? `Group Task Assigned: ${task.title}` : `Task Assigned: ${task.title}`,
    html
  });
};

/**
 * Send deadline reminder email
 */
const sendDeadlineReminderEmail = async ({ user, task, community, hoursRemaining }) => {
  const urgency = hoursRemaining <= 24 ? 'urgent' : 'normal';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${urgency === 'urgent' ? '#dc2626' : '#ea580c'}; color: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid ${urgency === 'urgent' ? '#991b1b' : '#c2410c'}; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 30px; }
        .task-card { background: #fef3c7; border-left: 4px solid #ea580c; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: ${urgency === 'urgent' ? '#dc2626' : '#ea580c'}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3); }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Deadline Reminder</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          <p><strong>Your task "${task.title}" is due in ${hoursRemaining} hours!</strong></p>
          
          <div class="task-card">
            <h3>${task.title}</h3>
            <p><strong>Community:</strong> ${community.name || community}</p>
            <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleString()}</p>
            <p><strong>Time Remaining:</strong> ${hoursRemaining} hours</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/tasks" class="button">View Task</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Reminder: ${task.title} deadline approaching!`,
    html
  });
};

/**
 * Send task completed notification email
 */
const sendTaskCompletedEmail = async ({ user, task, completedBy, community }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #059669; color: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #047857; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 30px; }
        .success-card { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3); }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Task Completed!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${user.full_name}!</h2>
          <p>The task <strong>"${task.title}"</strong> has been completed by ${completedBy.full_name || completedBy}.</p>
          
          <div class="success-card">
            <h3>${task.title}</h3>
            <p><strong>Community:</strong> ${community.name || community}</p>
            <p><strong>Points Earned:</strong> 🏆 ${task.points || 0}</p>
            <p><strong>Completed by:</strong> ${completedBy.full_name || completedBy}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/tasks" class="button">View All Tasks</a>
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Task Completed: ${task.title}`,
    html
  });
};

/**
 * Send community invite email
 */
const sendCommunityInviteEmail = async ({ email, communityName, communityCode, invitedBy }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #7c3aed; color: white; padding: 40px 30px; text-align: center; border-bottom: 4px solid #6d28d9; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .content { padding: 30px; }
        .invite-card { background: #f3f4f6; border: 2px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .code { font-size: 24px; font-weight: bold; background: #ede9fe; color: #6d28d9; padding: 10px 20px; border-radius: 8px; display: inline-block; margin: 10px 0; letter-spacing: 2px; }
        .button { display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3); }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <h2>Join ${communityName}</h2>
          <p><strong>${invitedBy}</strong> has invited you to join the <strong>${communityName}</strong> community on Loomio.</p>
          
          <div class="invite-card">
            <p><strong>Your Community Code:</strong></p>
            <div class="code">${communityCode}</div>
            <p style="font-size: 14px; color: #6b7280;">Use this code to join the community</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/register" class="button">Join Now</a>
          </p>
          
          <p>Start collaborating on tasks, earning points, and contributing to your community!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `You're invited to join ${communityName} on Loomio!`,
    html
  });
};

/**
 * Strip HTML tags for plain text version
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .trim();
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendDeadlineReminderEmail,
  sendTaskCompletedEmail,
  sendCommunityInviteEmail
};
