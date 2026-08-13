const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.enabled = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    this.transporter = this.enabled
      ? nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        })
      : null;
  }

  async sendInterviewResultEmail(userEmail, userName, interviewData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: `Interview Result - ${interviewData.title}`,
      html: this.getInterviewResultTemplate(userName, interviewData),
    };

    return this.sendEmail(mailOptions);
  }

  async sendQuizResultEmail(userEmail, userName, quizData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: `Quiz Result - ${quizData.quizName}`,
      html: this.getQuizResultTemplate(userName, quizData),
    };

    return this.sendEmail(mailOptions);
  }

  async sendTestResultEmail(userEmail, userName, testData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: `Mock Test Result - ${testData.testName}`,
      html: this.getTestResultTemplate(userName, testData),
    };

    return this.sendEmail(mailOptions);
  }

  async sendPurchaseConfirmationEmail(userEmail, userName, purchaseData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: `Purchase Confirmation - ${purchaseData.pdfName}`,
      html: this.getPurchaseConfirmationTemplate(userName, purchaseData),
    };

    return this.sendEmail(mailOptions);
  }

  async sendCertificateEmail(userEmail, userName, certificateData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: `Certificate - ${certificateData.title}`,
      html: this.getCertificateTemplate(userName, certificateData),
    };

    return this.sendEmail(mailOptions);
  }

  async sendEmail(mailOptions) {
    if (!this.transporter) {
      return {
        success: false,
        message: 'Email service is not configured',
      };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Error sending email:', error.message);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message,
      };
    }
  }

  getInterviewResultTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .result { font-size: 18px; font-weight: bold; margin: 10px 0; }
            .pass { color: #27ae60; }
            .fail { color: #e74c3c; }
            .details { margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Result</h1>
              <p style="margin: 0;">StudyHub Platform</p>
            </div>
            <p>Dear ${userName},</p>
            <p>We're excited to share your interview results. Here's how you performed:</p>
            <div class="content">
              <div><strong>Interview Title:</strong> ${data.title}</div>
              ${data.companyName ? `<div><strong>Company:</strong> ${data.companyName}</div>` : ''}
              ${data.position ? `<div><strong>Position:</strong> ${data.position}</div>` : ''}
              <div class="result ${data.result === 'pass' || data.percentage >= data.passPercentage ? 'pass' : 'fail'}">
                Result: ${(data.percentage >= data.passPercentage ? 'PASSED' : 'NEEDS IMPROVEMENT').toUpperCase()}
              </div>
              <div class="details">
                <div class="detail-row"><span>Score:</span><strong>${data.score}/${data.maxScore}</strong></div>
                <div class="detail-row"><span>Percentage:</span><strong>${data.percentage}%</strong></div>
              </div>
              ${data.feedback ? `<div style="margin-top: 15px; padding: 10px; background: white; border-left: 4px solid #667eea;"><strong>Feedback:</strong><p>${data.feedback}</p></div>` : ''}
            </div>
            <p>Keep practicing and improving! Log in to your profile to see detailed analysis and recommendations.</p>
            <div class="footer">
              <p>� 2024 StudyHub. All rights reserved.</p>
              <p>For questions, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getQuizResultTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .result { font-size: 18px; font-weight: bold; margin: 10px 0; }
            .pass { color: #27ae60; }
            .fail { color: #e74c3c; }
            .details { margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Quiz Result</h1>
              <p style="margin: 0;">StudyHub Platform</p>
            </div>
            <p>Dear ${userName},</p>
            <p>Your quiz has been evaluated. Check out your results below:</p>
            <div class="content">
              <div><strong>Quiz Name:</strong> ${data.quizName}</div>
              <div><strong>Category:</strong> ${data.quizCategory || 'General'}</div>
              <div class="result ${data.result === 'pass' ? 'pass' : 'fail'}">Result: ${data.result.toUpperCase()}</div>
              <div class="details">
                <div class="detail-row"><span>Score:</span><strong>${data.score}/${data.maxScore}</strong></div>
                <div class="detail-row"><span>Percentage:</span><strong>${data.percentage}%</strong></div>
                <div class="detail-row"><span>Questions Answered:</span><strong>${data.questionsAnswered}/${data.totalQuestions}</strong></div>
              </div>
            </div>
            <p>Visit your profile to see detailed analysis and prepare for your next quiz!</p>
            <div class="footer">
              <p>� 2024 StudyHub. All rights reserved.</p>
              <p>For questions, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getTestResultTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .result { font-size: 18px; font-weight: bold; margin: 10px 0; }
            .pass { color: #27ae60; }
            .fail { color: #e74c3c; }
            .details { margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Mock Test Result</h1>
              <p style="margin: 0;">StudyHub Platform</p>
            </div>
            <p>Dear ${userName},</p>
            <p>Your mock test has been evaluated. Here's your detailed report:</p>
            <div class="content">
              <div><strong>Test Name:</strong> ${data.testName}</div>
              ${data.companyName ? `<div><strong>Company:</strong> ${data.companyName}</div>` : ''}
              <div><strong>Difficulty:</strong> ${data.difficulty || 'Medium'}</div>
              <div class="result ${data.result === 'pass' ? 'pass' : 'fail'}">Result: ${data.result.toUpperCase()}</div>
              <div class="details">
                <div class="detail-row"><span>Score:</span><strong>${data.score}/${data.maxScore}</strong></div>
                <div class="detail-row"><span>Percentage:</span><strong>${data.percentage}%</strong></div>
                <div class="detail-row"><span>Correct Answers:</span><strong>${data.correctAnswers}/${data.questionsAttempted}</strong></div>
                <div class="detail-row"><span>Time Taken:</span><strong>${this.formatTime(data.timeTaken)}</strong></div>
              </div>
            </div>
            <p>Log in to your profile to review detailed analysis, weak areas, and recommendations!</p>
            <div class="footer">
              <p>� 2024 StudyHub. All rights reserved.</p>
              <p>For questions, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getPurchaseConfirmationTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .details { margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .amount { font-size: 18px; font-weight: bold; color: #27ae60; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Purchase Confirmation</h1>
              <p style="margin: 0;">Your payment has been received!</p>
            </div>
            <p>Dear ${userName},</p>
            <p>Thank you for your purchase! Here are your details:</p>
            <div class="content">
              <div><strong>PDF Name:</strong> ${data.pdfName}</div>
              <div><strong>Category:</strong> ${data.pdfCategory || 'General'}</div>
              <div class="details">
                <div class="detail-row"><span>Amount:</span><strong class="amount">Rs.${data.amount}</strong></div>
                <div class="detail-row"><span>Transaction ID:</span><strong>${data.transactionId}</strong></div>
                <div class="detail-row"><span>Payment Status:</span><strong style="color: #27ae60;">COMPLETED</strong></div>
                <div class="detail-row"><span>Date:</span><strong>${new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>
            <p>You can now download your PDF from your profile. The download link has been sent to your account.</p>
            <div class="footer">
              <p>� 2024 StudyHub. All rights reserved.</p>
              <p>For questions, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getCertificateTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; text-align: center; }
            .certificate-title { font-size: 24px; font-weight: bold; color: #f39c12; margin: 15px 0; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Certificate Achievement</h1>
              <p style="margin: 0;">Congratulations!</p>
            </div>
            <p>Dear ${userName},</p>
            <p>We're thrilled to inform you that you've earned a certificate!</p>
            <div class="content">
              <div class="certificate-title">${data.title}</div>
              <p>Issued on: ${new Date().toLocaleDateString()}</p>
              ${data.description ? `<p>${data.description}</p>` : ''}
            </div>
            <p>You can download and share your certificate from your profile. Share your achievement on social media!</p>
            <div class="footer">
              <p>� 2024 StudyHub. All rights reserved.</p>
              <p>For questions, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  formatTime(seconds) {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0) result += `${secs}s`;

    return result.trim();
  }

  async sendLoginConfirmationEmail(userEmail, userName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: 'Login Successful - StudyHub',
      html: this.getLoginConfirmationTemplate(userName),
    };

    return this.sendEmail(mailOptions);
  }

  async sendFeedbackEmail(userEmail, userName, feedbackData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@studyhub.com',
      to: userEmail,
      subject: 'Your Interview Feedback - StudyHub',
      html: this.getFeedbackTemplate(userName, feedbackData),
    };

    return this.sendEmail(mailOptions);
  }

  getLoginConfirmationTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .success-badge { display: inline-block; background: #27ae60; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold; margin: 15px 0; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome Back!</h1>
              <p style="margin: 0;">StudyHub Platform</p>
            </div>
            <p>Dear ${userName},</p>
            <p>You have successfully logged into your StudyHub account.</p>
            <div class="content">
              <div class="success-badge">✓ Login Successful</div>
              <p><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
              <p>If you did not log in to your account, please reset your password immediately by visiting your account settings.</p>
            </div>
            <p>Start preparing for your interviews, quizzes, and tests to achieve your goals!</p>
            <div class="footer">
              <p>© 2024 StudyHub. All rights reserved.</p>
              <p>For security concerns, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getFeedbackTemplate(userName, data) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 5px; }
            .feedback-section { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 5px; }
            .section-title { font-weight: bold; color: #667eea; margin-bottom: 10px; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
            .stat-box { padding: 10px; background: white; border-radius: 5px; text-align: center; border: 1px solid #e0e0e0; }
            .stat-value { font-size: 20px; font-weight: bold; color: #667eea; }
            .stat-label { font-size: 12px; color: #7f8c8d; margin-top: 5px; }
            .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Feedback</h1>
              <p style="margin: 0;">StudyHub Platform</p>
            </div>
            <p>Dear ${userName},</p>
            <p>Thank you for completing your interview! Here's your comprehensive feedback and transcript summary.</p>
            
            ${data.stats ? `
            <div class="stats">
              <div class="stat-box">
                <div class="stat-value">${data.stats.duration || '0'}s</div>
                <div class="stat-label">Interview Duration</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${data.stats.questions || '0'}</div>
                <div class="stat-label">Questions Asked</div>
              </div>
            </div>
            ` : ''}

            ${data.feedback ? `
            <div class="feedback-section">
              <div class="section-title">General Feedback</div>
              <p>${data.feedback}</p>
            </div>
            ` : ''}

            ${data.strengths && data.strengths.length > 0 ? `
            <div class="feedback-section">
              <div class="section-title">Your Strengths</div>
              <ul>
                ${data.strengths.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            ${data.improvements && data.improvements.length > 0 ? `
            <div class="feedback-section">
              <div class="section-title">Areas for Improvement</div>
              <ul>
                ${data.improvements.map(i => `<li>${i}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div class="content">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review your performance in detail from your profile</li>
                <li>Practice similar questions to improve weak areas</li>
                <li>Take another mock interview to track progress</li>
              </ul>
            </div>

            <p>Log in to your profile to access the complete transcript, video recording, and detailed analysis.</p>
            <div class="footer">
              <p>© 2024 StudyHub. All rights reserved.</p>
              <p>For questions, contact: support@studyhub.com</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
