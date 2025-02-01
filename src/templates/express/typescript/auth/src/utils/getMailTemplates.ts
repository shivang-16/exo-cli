import { Options } from './sendMail';

export const getTemplate = (options: Options) => {
	const baseTemplate = (content: string) => `
   <div style="max-width:37.5em;margin:0 auto;font-family:Arial, sans-serif;background-color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:30px 20px;text-align:center;">
        <img alt="Company Logo" height="60" src="https://placehold.co/200x60" style="max-height: 60px;" />
      </td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:0 20px;text-align:center;"> ${content} </td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e0e0e0;">
    <tr>
      <td style="padding:30px 40px;text-align:center;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align:left;padding-bottom:15px;width:66%">
              <img alt="Company Logo" height="36" src="https://placehold.co/120x36" width="120" />
            </td>
            <td style="text-align:right;padding-bottom:15px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="#" target="_blank">
                      <img alt="Twitter" height="32" src="https://placehold.co/32x32" width="32" />
                    </a>
                  </td>
                  <td style="padding-right:10px;">
                    <a href="#" target="_blank">
                      <img alt="Instagram" height="32" src="https://placehold.co/32x32" width="32" />
                    </a>
                  </td>
                  <td>
                    <a href="#" target="_blank">
                      <img alt="LinkedIn" height="32" src="https://placehold.co/32x32" width="32" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size:12px;color:#b7b7b7;text-align:center;padding-top:15px;padding-bottom:15px;">
              <a href="#" style="color:#b7b7b7;text-decoration:underline;" target="_blank">Terms & Conditions</a> | <a href="#" style="color:#b7b7b7;text-decoration:underline;" target="_blank">Privacy Policy</a>
              <p style="margin-top:20px;">©${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>

  `;

	// Now insert the specific content depending on the tag
	switch (options.tag) {
		case 'otp':
			return baseTemplate(`
       
        <h1 style="font-size:28px;font-weight:700;margin:30px 0;color:#333;">Confirm Your Email Address</h1>
    <p style="font-size:18px;margin-bottom:30px;color:#555;">Please use the code below to complete your registration.</p>
    
  
    <div style="background-color:#f5f4f5; border-radius:8px; padding:25px; text-align:center; max-width:300px; margin:auto; margin-bottom:30px;">
      <p style="font-size:24px;margin:0;font-weight:bold;color:#333;">${options.message}</p>
    </div>
    
    <p style="font-size:14px;margin:30px 0;color:#555;">If you don't want to create an account, you can ignore this email.</p>
      `);

		case 'password_reset':
			return baseTemplate(`
        <h1 style="font-size:28px;font-weight:700;margin:30px 0;color:#333;">Password Reset Request</h1>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${options.message}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #007bff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request a password reset, please ignore this email.</p>
      `);

		default:
			return baseTemplate(options.message);
	}
};
