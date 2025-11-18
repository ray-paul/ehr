from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Report


User = get_user_model()


class ReportsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(username='doc', password='pass', user_type='doctor')
        self.patient = User.objects.create_user(username='pat', password='pass', user_type='patient')

    def test_provider_full_crud(self):
        self.client.force_authenticate(self.doctor)
        # create
        resp = self.client.post('/api/reports/', {'title': 'R1', 'content': 'C1'}, format='json')
        self.assertEqual(resp.status_code, 201)
        report_id = resp.data['id']
        # update
        resp2 = self.client.patch(f'/api/reports/{report_id}/', {'title': 'R1b'}, format='json')
        self.assertEqual(resp2.status_code, 200)
        # delete
        resp3 = self.client.delete(f'/api/reports/{report_id}/')
        self.assertIn(resp3.status_code, (204, 200))

    def test_patient_cannot_create_but_can_read_empty(self):
        self.client.force_authenticate(self.patient)
        resp = self.client.post('/api/reports/', {'title': 'PatientReport', 'content': 'Should fail'}, format='json')
        # patient should not be allowed to create
        self.assertIn(resp.status_code, (401, 403))
        # reading list should be allowed (may be empty)
        resp2 = self.client.get('/api/reports/')
        self.assertEqual(resp2.status_code, 200)
