# backend/notifications/email_service.py
import os
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending email notifications"""
    
    @staticmethod
    def send_notification_email(user_email, user_name, notification_data):
        """
        Send a notification email to user using HTML templates
        """
        try:
            context = {
                'user_name': user_name,
                'notification_title': notification_data.get('title', 'New Notification'),
                'notification_message': notification_data.get('message', ''),
                'notification_type': notification_data.get('type', 'general'),
                'priority': notification_data.get('priority', 'normal'),
                'action_url': notification_data.get('action_url', ''),
                'unsubscribe_url': notification_data.get('unsubscribe_url', '#'),
                'current_year': timezone.now().year,
                'system_name': 'EHR System'
            }
            
            # Render HTML email template
            html_content = render_to_string('emails/notification.html', context)
            text_content = strip_tags(html_content)
            
            # Create email
            email = EmailMultiAlternatives(
                subject=f"EHR System: {notification_data.get('title', 'New Notification')}",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user_email],
                reply_to=['support@ehrsystem.com']
            )
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            email.send()
            logger.info(f"Email notification sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {user_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_appointment_reminder(patient_email, patient_name, appointment_data):
        """Send appointment reminder email"""
        context = {
            'patient_name': patient_name,
            'appointment_date': appointment_data.get('date'),
            'appointment_time': appointment_data.get('time'),
            'doctor_name': appointment_data.get('doctor_name', 'Your Doctor'),
            'appointment_type': appointment_data.get('type', 'Regular Checkup'),
            'location': appointment_data.get('location', 'Main Clinic'),
            'preparation_instructions': appointment_data.get('instructions', 'Please arrive 15 minutes early.'),
            'cancel_link': appointment_data.get('cancel_link', '#'),
            'reschedule_link': appointment_data.get('reschedule_link', '#')
        }
        
        try:
            html_content = render_to_string('emails/appointment_reminder.html', context)
            text_content = strip_tags(html_content)
            
            email = EmailMultiAlternatives(
                subject=f"Appointment Reminder: {appointment_data.get('date')} at {appointment_data.get('time')}",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[patient_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            logger.info(f"Appointment reminder sent to {patient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send appointment reminder to {patient_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_lab_result_notification(patient_email, patient_name, lab_data):
        """Send lab result notification email"""
        context = {
            'patient_name': patient_name,
            'test_name': lab_data.get('test_name', 'Laboratory Test'),
            'result_summary': lab_data.get('summary', 'Your results are ready'),
            'result_url': lab_data.get('result_url', '#'),
            'doctor_notes': lab_data.get('doctor_notes', 'Please review your results with your doctor.'),
            'follow_up_needed': lab_data.get('follow_up_needed', False)
        }
        
        try:
            html_content = render_to_string('emails/lab_results.html', context)
            text_content = strip_tags(html_content)
            
            email = EmailMultiAlternatives(
                subject=f"Your Lab Results are Ready: {lab_data.get('test_name', 'Test Results')}",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[patient_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            logger.info(f"Lab result notification sent to {patient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send lab result to {patient_email}: {str(e)}")
            return False