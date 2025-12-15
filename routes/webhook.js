// const express = require("express");
// const router = express.Router();

// const { handlePaymentSuccess } = require("../services/paymentService");

// router.post("/payment-success", async (req, res) => {
//   try {
//     await handlePaymentSuccess(req.body);
//     res.status(200).json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Webhook processing failed" });
//   }
// });

// module.exports = router;
