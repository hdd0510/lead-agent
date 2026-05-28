"""Send transactional emails via Sendgrid."""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    from_email: Optional[str] = None,
) -> bool:
    """Send an email via Sendgrid. Returns True on success, False if not configured."""
    from config import settings

    if not settings.SENDGRID_API_KEY:
        logger.info("SENDGRID_API_KEY not set — skipping email to %s", to_email)
        return False

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        message = Mail(
            from_email=from_email or settings.SENDGRID_FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            plain_text_content=body,
        )
        response = sg.send(message)
        logger.info("Email sent to %s — status %s", to_email, response.status_code)
        return True

    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False
