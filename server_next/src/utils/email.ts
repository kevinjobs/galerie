import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    return await transporter.sendMail({
      from: `Admin<${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}

export const sendVerificationEmail = async (to: string, code: string) => {
  return await sendEmail(to, "This is your code", template(code));
}


const template = (code: string) => `<div>
    <includetail>
        <style>
            /* CLIENT-SPECIFIC STYLES */
            body, table, td, a {
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }

            table, td {
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
            }

            img {
                -ms-interpolation-mode: bicubic;
            }

            .hidden {
                display: none !important;
                visibility: hidden !important;
            }

            /* iOS BLUE LINKS */
            a[x-apple-data-detectors] {
                color: inherit !important;
                text-decoration: none !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
            }

            /* ANDROID MARGIN HACK */
            body {
                margin: 0 !important;
            }

            div[style*="margin: 16px 0"] {
                margin: 0 !important;
            }

            @media only screen and (max-width: 639px) {
                body, #body {
                    min-width: 320px !important;
                }

                table.wrapper {
                    width: 100% !important;
                    min-width: 320px !important;
                }
            }
        </style>
        <style>
            body {
                -webkit-text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
            }

            img {
                -ms-interpolation-mode: bicubic;
            }

            body {
                margin: 0 !important;
            }
        </style>


        <table border="0" cellpadding="0" cellspacing="0" id="body"
               style="text-align: center; min-width: 640px; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 0; padding: 0;"
               bgcolor="#fafafa">
            <tbody>
            
            <tr>
                <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                    <table border="0" cellpadding="0" cellspacing="0" class="wrapper"
                           style="width: 640px; border-collapse: separate; border-spacing: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; margin: 0 auto;">
                        <tbody>
                        <tr>
                            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; border-radius: 3px; overflow: hidden; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; padding: 18px 25px; border: 1px solid #ededed;"
                                align="left" bgcolor="#ffffff">
                                <table border="0" cellpadding="0" cellspacing="0" class="content"
                                       style="width: 100%; border-collapse: separate; border-spacing: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                    <tbody>
                                    <tr>
                                        <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; color: #333333; font-size: 15px; font-weight: 400; line-height: 1.4; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; padding: 15px 5px;"
                                            align="center">
                                            <h1 style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; color: #333333; font-size: 18px; font-weight: 400; line-height: 1.4; margin: 0; padding: 0;"
                                                align="center">
                                                你好！
                                            </h1>
                                            <p>
                                                这是你的验证码：<strong style="color: #6b4fbb; font-size: 24px;">${code}</strong>
                                            </p>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr class="footer">
                <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; font-size: 13px; line-height: 1.6; color: #5c5c5c; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; padding: 25px 0;">
                    
                    <div>
                        您收到这封电子邮件是因为你尝试在本站申请注册账户。如果你没有进行过相关操作，请忽略这封邮件。
                    </div>
                </td>
            </tr>

            </tbody>
        </table>
    </includetail>
</div>
`