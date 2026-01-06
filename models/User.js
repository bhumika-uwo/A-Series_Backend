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
    verificationCode: Number,
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
    }

}, { timestamps: true });

export default mongoose.model('User', userSchema);