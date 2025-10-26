const { Resend } = require('resend');

/**
 * Email Service for sending notifications and alerts using Resend
 * Docs: https://resend.com/docs/send-with-nodejs
 */

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not set - email not sent');
      return { success: false, error: 'Resend API key not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Loomio <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
      text: text || stripHtml(html)
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email sending failed:', error);
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
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #d946ef 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Loomio!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          <p>Thank you for joining Loomio - your community task management platform!</p>
          <p>You can now:</p>
          <ul>
            <li> Create and join communities</li>
            <li> Manage tasks and collaborate with your team</li>
            <li> Track contributions and earn recognition</li>
            <li> View analytics and insights</li>
          </ul>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started</a>
          </p>
          <p><strong>Your Account Details:</strong></p>
          <p>Email: ${user.email}</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>Threads of Effort, Woven Into Outcomes</p>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Loomio! 🎉',
    html
  });
};

/**
 * Send task assigned notification email
 */
const sendTaskAssignedEmail = async ({ user, task, assignedBy, community }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #d946ef 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .task-card { background: white; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-medium { background: #fef3c7; color: #92400e; }
        .priority-low { background: #dbeafe; color: #1e40af; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Task Assigned</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          <p>You have been assigned a new task by <strong>${assignedBy}</strong> in <strong>${community}</strong>.</p>
          
          <div class="task-card">
            <h3 style="margin-top: 0;">${task.title}</h3>
            <p>${task.description || 'No description provided'}</p>
            <p><strong>Priority:</strong> <span class="priority priority-${task.priority}">${task.priority?.toUpperCase()}</span></p>
            ${task.deadline ? `<p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
            <p><strong>Points:</strong> ${task.points || 0}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/tasks" class="button">View Task</a>
          </p>
        </div>
        <div class="footer">
          <p>Threads of Effort, Woven Into Outcomes</p>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `📋 New Task: ${task.title}`,
    html
  });
};

/**
 * Send task deadline reminder email
 */
const sendDeadlineReminderEmail = async ({ user, task, community, hoursRemaining }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .task-card { background: white; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Deadline Reminder</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          
          <div class="alert">
            <strong>⚠️ Urgent:</strong> Task deadline is approaching in ${hoursRemaining} hours!
          </div>
          
          <div class="task-card">
            <h3 style="margin-top: 0;">${task.title}</h3>
            <p>${task.description || 'No description provided'}</p>
            <p><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Community:</strong> ${community}</p>
            <p><strong>Status:</strong> ${task.status}</p>
          </div>
          
          <p>Don't forget to complete your task before the deadline!</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/tasks" class="button">Complete Task</a>
          </p>
        </div>
        <div class="footer">
          <p>Threads of Effort, Woven Into Outcomes</p>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `⏰ Reminder: ${task.title} deadline approaching!`,
    html
  });
};

/**
 * Send task completion notification email
 */
const sendTaskCompletedEmail = async ({ user, task, completedBy, community }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .success-card { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Task Completed!</h1>
        </div>
        <div class="content">
          <h2>Hi ${user.full_name},</h2>
          <p>Great news! A task has been completed in <strong>${community}</strong>.</p>
          
          <div class="success-card">
            <h3 style="margin-top: 0;">🎉 ${task.title}</h3>
            <p><strong>Completed by:</strong> ${completedBy}</p>
            <p><strong>Points Earned:</strong> ${task.points || 0}</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/leaderboard" class="button">View Leaderboard</a>
          </p>
        </div>
        <div class="footer">
          <p>Threads of Effort, Woven Into Outcomes</p>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `✅ Task Completed: ${task.title}`,
    html
  });
};

/**
 * Send community invitation email
 */
const sendCommunityInviteEmail = async ({ email, communityName, communityCode, invitedBy }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #d946ef 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .code-box { background: white; border: 2px dashed #6366f1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 4px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎊 You're Invited!</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p><strong>${invitedBy}</strong> has invited you to join <strong>${communityName}</strong> on Loomio!</p>
          
          <p>Use this code to join the community:</p>
          
          <div class="code-box">
            <div class="code">${communityCode}</div>
          </div>
          
          <p>To join:</p>
          <ol>
            <li>Visit Loomio and sign in (or create an account)</li>
            <li>Click "Join Community"</li>
            <li>Enter the code above</li>
          </ol>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/join" class="button">Join Now</a>
          </p>
        </div>
        <div class="footer">
          <p>Threads of Effort, Woven Into Outcomes</p>
          <p>&copy; ${new Date().getFullYear()} Loomio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `🎊 You're invited to join ${communityName} on Loomio!`,
    html
  });
};

/**
 * Strip HTML tags for plain text fallback
 */
const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '');
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendDeadlineReminderEmail,
  sendTaskCompletedEmail,
  sendCommunityInviteEmail
};
