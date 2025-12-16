import express from "express"
import userModel from "../models/User.js"
const router = express.Router()


router.post("/", async (req, res) => {
    const { code, email } = req.body
    const user = await userModel.findOne({ email })

    if (user.verificationCode == code) {
        user.isVerified = true
        user.verificationCode = undefined
        res.status(201).json({ msg: "successfully regestor" })

    } else {
        res.status(401).json({ msg: "incorrect credentials " })
    }
    await user.save()
})
export default router