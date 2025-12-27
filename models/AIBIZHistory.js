import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
    {
        businessName: { type: String, required: false },
        idea: { type: String, required: false },
        industry: { type: String, required: false },
        targetAudience: { type: String, required: false },
        tone: { type: String, default: "formal" },
        docType: { type: String, default: "business_plan" },
        content: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false } // Added userId for potential future auth linking
    },
    { timestamps: true }
);

export default mongoose.model("AIBIZHistory", historySchema);
