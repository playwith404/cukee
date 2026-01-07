"""
이메일 발송 서비스
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


class EmailService:
    """이메일 발송 서비스"""

    @staticmethod
    def send_verification_email(to_email: str, code: str) -> bool:
        """인증번호 이메일 발송"""
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            raise ValueError("SMTP 설정이 완료되지 않았습니다.")

        subject = "[Cukee] 이메일 인증번호"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    color: #6366f1;
                    margin-bottom: 30px;
                }}
                .title {{
                    font-size: 20px;
                    color: #333333;
                    margin-bottom: 20px;
                }}
                .code-box {{
                    background-color: #f0f0ff;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }}
                .code {{
                    font-size: 36px;
                    font-weight: bold;
                    color: #6366f1;
                    letter-spacing: 8px;
                }}
                .notice {{
                    font-size: 14px;
                    color: #666666;
                    margin-top: 20px;
                }}
                .footer {{
                    font-size: 12px;
                    color: #999999;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eeeeee;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Cukee</div>
                <div class="title">이메일 인증번호를 확인해주세요</div>
                <p>안녕하세요! Cukee 회원가입을 위한 인증번호입니다.</p>
                <div class="code-box">
                    <div class="code">{code}</div>
                </div>
                <p class="notice">
                    이 인증번호는 {settings.VERIFICATION_CODE_EXPIRE_MINUTES}분간 유효합니다.<br>
                    본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.
                </p>
                <div class="footer">
                    본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해주세요.
                </div>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to_email

        text_content = f"""
        [Cukee] 이메일 인증번호

        안녕하세요! Cukee 회원가입을 위한 인증번호입니다.

        인증번호: {code}

        이 인증번호는 {settings.VERIFICATION_CODE_EXPIRE_MINUTES}분간 유효합니다.
        본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.
        """

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"이메일 발송 실패: {e}")
            raise

    @staticmethod
    def send_password_reset_email(to_email: str, code: str) -> bool:
        """비밀번호 재설정 이메일 발송"""
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            raise ValueError("SMTP 설정이 완료되지 않았습니다.")

        subject = "[Cukee] 비밀번호 재설정 인증번호"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }}
                .logo {{
                    font-size: 28px;
                    font-weight: bold;
                    color: #6366f1;
                    margin-bottom: 30px;
                }}
                .title {{
                    font-size: 20px;
                    color: #333333;
                    margin-bottom: 20px;
                }}
                .code-box {{
                    background-color: #f0f0ff;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 30px 0;
                }}
                .code {{
                    font-size: 36px;
                    font-weight: bold;
                    color: #6366f1;
                    letter-spacing: 8px;
                }}
                .notice {{
                    font-size: 14px;
                    color: #666666;
                    margin-top: 20px;
                }}
                .footer {{
                    font-size: 12px;
                    color: #999999;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #eeeeee;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">Cukee</div>
                <div class="title">비밀번호 재설정 인증번호</div>
                <p>안녕하세요! Cukee 비밀번호 재설정을 위한 인증번호입니다.</p>
                <div class="code-box">
                    <div class="code">{code}</div>
                </div>
                <p class="notice">
                    이 인증번호는 {settings.VERIFICATION_CODE_EXPIRE_MINUTES}분간 유효합니다.<br>
                    본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.
                </p>
                <div class="footer">
                    본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해주세요.
                </div>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
        msg["To"] = to_email

        text_content = f"""
        [Cukee] 비밀번호 재설정 인증번호

        안녕하세요! Cukee 비밀번호 재설정을 위한 인증번호입니다.

        인증번호: {code}

        이 인증번호는 {settings.VERIFICATION_CODE_EXPIRE_MINUTES}분간 유효합니다.
        본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.
        """

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"이메일 발송 실패: {e}")
            raise
