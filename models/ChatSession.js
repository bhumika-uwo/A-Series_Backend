import mongoose from 'mongoose';


const messageSchema = new mongoose.Schema({
  id: String,
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  content: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
  attachment: {
    type: { type: String, enum: ['image', 'pdf'] },
    url: String,
    name: String
  }
});

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  lastModified: { type: Number, default: Date.now }
}, { timestamps: true });
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession