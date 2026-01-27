const mailer = require('../config/mailer');

/**
 * Universal Notification Service
 * Handles multi-channel alerts (Email, Socket.IO)
 */
class NotificationService {
    constructor() {
        this.io = null;
    }

    init(io) {
        this.io = io;
        console.log('--- Notification Service Initialized ---');
    }

    /**
     * Notify User via specific channels
     * @param {Object} options 
     * @param {string} options.to Email address
     * @param {string} options.userId Database User ID for Socket.IO
     * @param {string} options.subject Email Subject
     * @param {string} options.message Plain text message
     * @param {string} options.event Socket.IO event name
     * @param {Object} options.data Data to send via Socket.IO
     */
    async notify({ to, userId, subject, message, event, data }) {
        // 1. Send Email if recipient provided
        if (to) {
            try {
                await mailer.sendMail({
                    from: '"Daru Hunting" <notifications@daruhunting.com.np>',
                    to,
                    subject,
                    text: message
                });
            } catch (error) {
                console.error(`[NotificationService] Email failed to ${to}:`, error.message);
            }
        }

        // 2. Send Socket.IO Real-time update if IO and userId provided
        if (this.io && userId && event) {
            this.io.to(userId.toString()).emit(event, data);
        }
    }

    /**
     * Specific helper for Orders
     */
    async notifyOrderUpdate(user, order, statusLabel) {
        await this.notify({
            to: user.email,
            userId: user._id,
            subject: `Order #${order._id.toString().slice(-6).toUpperCase()} Update: ${statusLabel} 🎯`,
            message: `Hello ${user.name},\n\nYour order status has been updated to: ${statusLabel}.\n\nOrder Total: ${order.total} NPR\n\nDaru Hunting has your inventory locked and moving.`,
            event: 'order:status_change',
            data: { orderId: order._id, status: order.status, label: statusLabel }
        });
    }

    /**
     * Specific helper for System Admin
     */
    async notifyAdmin(subject, message) {
        await this.notify({
            to: process.env.ADMIN_EMAIL || "service@daruhunting.com.np",
            subject,
            message
        });
    }
}

module.exports = new NotificationService();
