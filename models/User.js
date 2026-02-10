import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: '/User.jpeg'
    },
    agents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent"
    }],
    role: {
        type: String,
        default: "user"
    },
    chatSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "ChatSession" }],
    verificationCode: String,
    isBlocked: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    settings: {
        emailNotif: { type: Boolean, default: true },
        pushNotif: { type: Boolean, default: false },
        publicProfile: { type: Boolean, default: true },
        twoFactor: { type: Boolean, default: false }
    },
    personalizations: {
        // General Settings
        general: {
            language: { type: String, default: process.env.APP_DEFAULT_LANGUAGE || 'English' },
            theme: { type: String, enum: ['Light', 'Dark', 'System', 'light', 'dark', 'system'], default: 'System' },
            responseSpeed: { type: String, enum: ['Fast', 'Balanced', 'Detailed', 'fast', 'balanced', 'detailed'], default: 'Balanced' },
            screenReader: { type: Boolean, default: false },
            highContrast: { type: Boolean, default: false }
        },

        // Notifications
        notifications: {
            responses: { type: String, default: 'Push' }, // Push, Off
            groupChats: { type: String, default: 'Push' }, // Push, Off
            tasks: { type: String, default: 'Push, Email' }, // Push, Email, Off
            projects: { type: String, default: 'Email' }, // Email, Off
            recommendations: { type: String, default: 'Push, Email' } // Push, Email, Off
        },

        // Personalization (Core Feature)
        personalization: {
            fontStyle: {
                type: String,
                enum: ['Default', 'Serif', 'Mono', 'Sans', 'Rounded', 'default', 'serif', 'mono', 'sans', 'rounded'],
                default: 'Default'
            },
            characteristics: {
                enthusiasm: { type: String, default: 'Medium' },
                formality: { type: String, default: 'Medium' },
                creativity: { type: String, default: 'Medium' },
                directness: { type: String, default: 'Medium' }
            },
            headers: {
                structuredResponses: { type: Boolean, default: true },
                bulletPoints: { type: Boolean, default: true },
                stepByStep: { type: Boolean, default: true }
            },
            emojiUsage: {
                type: String,
                enum: ['None', 'Minimal', 'Moderate', 'Expressive', 'none', 'minimal', 'moderate', 'expressive'],
                default: 'Moderate'
            },
            fontSize: { type: String, default: 'Medium' }, // Added to match frontend data structure
            customInstructions: { type: String, default: '', maxlength: 1500 }
        },

        // Apps & Integrations
        apps: [{
            name: String,
            enabled: { type: Boolean, default: true },
            permissions: { type: String, enum: ['Read', 'Write', 'ReadWrite'], default: 'Read' },
            connectedAt: { type: Date, default: Date.now }
        }],

        // Data Controls
        dataControls: {
            chatHistory: { type: String, enum: ['On', 'Auto-delete', 'Off'], default: 'On' },
            trainingDataUsage: { type: Boolean, default: true },
            autoDeleteDays: { type: Number, default: 30 }
        },

        // Parental Controls
        parentalControls: {
            enabled: { type: Boolean, default: false },
            ageCategory: { type: String, enum: ['Child', 'Teen', 'Adult'], default: 'Adult' },
            contentFiltering: { type: String, enum: ['Strict', 'Moderate', 'Off'], default: 'Off' },
            disableSensitiveTopics: { type: Boolean, default: false },
            timeUsageLimits: { type: Number, default: 0 } // minutes per day, 0 = unlimited
        },

        // Account
        account: {
            nickname: { type: String, default: '' },
            subscriptionPlan: { type: String, default: 'Free' }
        }
    },
    modePreferences: {
        defaultMode: { type: String, default: 'NORMAL_CHAT' },
        autoDetect: { type: Boolean, default: true }
    },
    plan: {
        type: String,
        enum: ['Basic', 'Pro', 'King'],
        default: 'Basic'
    },
    subscription: {
        id: String,
        status: String,
        currentPeriodEnd: Date,
        razorpay_payment_id: String,
        razorpay_order_id: String,
        razorpay_signature: String
    },
    notificationsInbox: [{
        id: String,
        title: String,
        desc: String,
        type: { type: String, enum: ['promo', 'update', 'alert'], default: 'promo' },
        time: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false }
    }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);