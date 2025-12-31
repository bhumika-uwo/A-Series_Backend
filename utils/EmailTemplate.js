export const Verification_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - AI Mall</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #ddd;
        }
        .header {
            background-color: #5555ff;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: bold;
        }
        .content {
            padding: 30px 25px;
            color: #333;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #333;
        }
        .verification-code {
            display: block;
            margin: 25px 0;
            font-size: 32px;
            color: #5555ff;
            background: #f0f0ff;
            border: 2px dashed #5555ff;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            font-weight: bold;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        .info-text {
            font-size: 15px;
            color: #555;
            margin: 15px 0;
        }
        .expiry-notice {
            background-color: #fff9e6;
            border-left: 4px solid #ffcc00;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #666;
        }
        .security-note {
            margin-top: 25px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            font-size: 13px;
            color: #666;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            color: #777;
            font-size: 12px;
            border-top: 1px solid #ddd;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #5555ff;
            text-decoration: none;
        }
        p {
            margin: 0 0 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Verify Your Email</h1>
        </div>
        <div class="content">
            <p class="greeting">Hello {name},</p>
            <p class="info-text">
                Thank you for signing up with AI Mall! To complete your registration and unlock access to our intelligent AI agents, please verify your email address using the code below:
            </p>
            <span class="verification-code">{verificationCode}</span>
            <div class="expiry-notice">
                ⏱️ This verification code will expire in 15 minutes for security purposes.
            </div>
            <p class="info-text">
                Simply enter this code on the verification page to activate your account and start exploring AI Mall.
            </p>
            <div class="security-note">
                <strong>🛡️ Security Notice:</strong> If you did not create an account with AI Mall, please disregard this email. No further action is required, and your email address will not be used.
            </div>
        </div>
        <div class="footer">
            <p><strong>AI Mall</strong> - Your Gateway to Intelligent AI Agents</p>
            <p>&copy; ${new Date().getFullYear()} AI Mall. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@aimall.com">support@aimall.com</a></p>
        </div>
    </div>
</body>
</html>
`;

export const Welcome_Email_Template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AI Mall</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #ddd;
        }
        .header {
            background-color: #007BFF;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 25px;
        }
        .welcome-message {
            font-size: 18px;
            margin: 0 0 20px;
            color: #333;
        }
        .intro-text {
            font-size: 15px;
            color: #555;
            margin-bottom: 25px;
            line-height: 1.7;
        }
        .features-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .features-title {
            font-size: 17px;
            font-weight: bold;
            color: #007BFF;
            margin: 0 0 15px;
        }
        .features-list {
            margin: 0;
            padding: 0 0 0 20px;
        }
        .features-list li {
            margin: 12px 0;
            font-size: 14px;
            color: #555;
            line-height: 1.6;
        }
        .agents-highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
        }
        .agents-highlight h3 {
            margin: 0 0 10px;
            font-size: 18px;
        }
        .agents-highlight p {
            margin: 0;
            font-size: 14px;
            opacity: 0.95;
        }
        .button {
            display: inline-block;
            padding: 14px 30px;
            margin: 25px 0;
            background-color: #007BFF;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .support-section {
            margin-top: 25px;
            padding: 15px;
            background-color: #e7f3ff;
            border-left: 4px solid #007BFF;
            border-radius: 4px;
            font-size: 14px;
            color: #555;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 20px;
            text-align: center;
            color: #777;
            font-size: 12px;
            border-top: 1px solid #ddd;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #007BFF;
            text-decoration: none;
        }
        p {
            margin: 0 0 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to AI Mall!</h1>
            <p>Your Gateway to Intelligent AI Agents</p>
        </div>
        <div class="content">
            <p class="welcome-message">Hello {name},</p>
            <p class="intro-text">
                We're thrilled to welcome you to AI Mall, the ultimate marketplace for intelligent AI agents! 
                Your journey into the future of AI-powered solutions starts here. Whether you're looking to 
                automate tasks, enhance productivity, or explore cutting-edge AI capabilities, AI Mall has 
                everything you need.
            </p>

            <div class="agents-highlight">
                <h3>🤖 Discover Our AI Agents</h3>
                <p>
                    Explore a diverse collection of specialized AI agents designed to solve real-world problems. 
                    From customer service bots to data analysis assistants, creative content generators to 
                    productivity enhancers – find the perfect AI agent for your needs.
                </p>
            </div>

            <div class="features-section">
                <p class="features-title">🚀 Here's how to get started:</p>
                <ul class="features-list">
                    <li><strong>Browse AI Agents:</strong> Explore our marketplace and discover agents tailored to your specific needs – from business automation to creative assistance.</li>
                    <li><strong>Try Before You Buy:</strong> Test drive AI agents with free trials to find the perfect match for your requirements.</li>
                    <li><strong>Customize Your Experience:</strong> Configure agents to work exactly how you want them, with personalized settings and integrations.</li>
                    <li><strong>Join the Community:</strong> Connect with other AI enthusiasts, share experiences, and stay updated on the latest AI innovations.</li>
                    <li><strong>24/7 Support:</strong> Our dedicated support team is always here to help you make the most of AI Mall.</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{dashboardUrl}" class="button">Explore AI Agents Now</a>
            </div>

            <div class="support-section">
                <strong>💡 Pro Tip:</strong> Start with our most popular agents to see AI Mall in action! 
                Check out our trending section for the top-rated AI solutions loved by our community.
            </div>

            <p class="intro-text" style="margin-top: 25px;">
                Thank you for choosing AI Mall. We're committed to bringing you the most advanced and 
                reliable AI agents to transform how you work, create, and innovate.
            </p>
        </div>
        <div class="footer">
            <p><strong>AI Mall</strong> - Empowering You with Intelligent AI Solutions</p>
            <p>&copy; ${new Date().getFullYear()} AI Mall. All rights reserved.</p>
            <p>Need assistance? Reach out to us at <a href="mailto:support@aimall.com">support@aimall.com</a></p>
            <p style="margin-top: 10px;">
                <a href="{privacyUrl}">Privacy Policy</a> | 
                <a href="{termsUrl}">Terms of Service</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

export const Reset_Password_Email_Template = `
<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Reset Your Password - AI Mall</title>
                        <style>
                            body {
                                font - family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                            color: #333;
                            line-height: 1.6;
        }
                            .container {
                                max - width: 600px;
                            margin: 30px auto;
                            background: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                            border: 1px solid #ddd;
        }
                            .header {
                                background - color: #FF5733;
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
        }
                            .header h1 {
                                margin: 0;
                            font-size: 26px;
                            font-weight: bold;
        }
                            .content {
                                padding: 30px 25px;
        }
                            .button {
                                display: inline-block;
                            padding: 14px 30px;
                            margin: 25px 0;
                            background-color: #FF5733;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            text-align: center;
                            font-size: 16px;
                            font-weight: 600;
                            transition: background-color 0.3s;
        }
                            .button:hover {
                                background - color: #E64A19;
        }
                            .footer {
                                background - color: #f4f4f4;
                            padding: 20px;
                            text-align: center;
                            color: #777;
                            font-size: 12px;
                            border-top: 1px solid #ddd;
        }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔒 Reset Your Password</h1>
                            </div>
                            <div class="content">
                                <p>Hello {name},</p>
                                <p>We received a request to reset your password for your AI Mall account. Click the button below to proceed:</p>
                                <div style="text-align: center;">
                                    <a href="{resetUrl}" class="button">Reset Password</a>
                                </div>
                                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                            </div>
                            <div class="footer">
                                <p><strong>AI Mall</strong> - Secure & Intelligent AI Solutions</p>
                            </div>
                        </div>
                    </body>
                </html>
                `;


// Helper function to replace placeholders in templates
export const renderEmailTemplate = (template, data) => {
    let rendered = template;

    // Replace all placeholders with actual data
    Object.keys(data).forEach(key => {
        const placeholder = new RegExp(`{${key}}`, 'g');
        rendered = rendered.replace(placeholder, data[key] || '');
    });

    return rendered;
};

// Helper function to create plain text version (Important for spam prevention!)
export const stripHTMLToText = (html) => {
    return html
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// Usage Examples:
/*
// Verification Email
const verificationEmail = renderEmailTemplate(Verification_Email_Template, {
    name: 'John Doe',
    verificationCode: '123456'
});

// Welcome Email
const welcomeEmail = renderEmailTemplate(Welcome_Email_Template, {
    name: 'John Doe',
    dashboardUrl: 'https://aimall.com/dashboard',
    unsubscribeUrl: 'https://aimall.com/unsubscribe',
    privacyUrl: 'https://aimall.com/privacy',
    termsUrl: 'https://aimall.com/terms'
});

// Create plain text version
const plainText = stripHTMLToText(welcomeEmail);
*/