import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    issueType: {
        type: String,
        required: true,
        enum: ["General Inquiry", "Payment Issue", "Refund Request", "Technical Support", "Account Access", "Other"],
    },
    message: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('SupportTicket', supportTicketSchema);
