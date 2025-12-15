const axios = require("axios");

async function activateVendorAccess(data) {
  try {
    await axios.post(
      process.env.VENDOR_API_URL,
      {
        user_id: data.user_id,
        plan: data.plan,
        credits: data.credits
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VENDOR_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Vendor access activated");
  } catch (error) {
    console.error("Vendor API call failed", error.message);
    throw error;
  }
}

module.exports = { activateVendorAccess };
