from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from accounts.models import User
from patients.models import Patient, ClinicalNote


class RBACPermissionsTests(TestCase):
    def setUp(self):
        # Create users
        self.doctor = User.objects.create_user(username='doc', password='pass', user_type='doctor')
        self.nurse = User.objects.create_user(username='nurse', password='pass', user_type='nurse')
        self.patient_user = User.objects.create_user(username='pat', password='pass', user_type='patient')

        # Create patient record for patient_user
        self.patient = Patient.objects.create(user=self.patient_user, date_of_birth='2000-01-01', gender='M')

        # Create API clients
        self.client = APIClient()

    def test_provider_can_list_all_patients(self):
        self.client.login(username='doc', password='pass')
        resp = self.client.get('/api/patients/patients/')
        self.assertEqual(resp.status_code, 200)
        # Should include the created patient
        self.assertGreaterEqual(len(resp.data.get('results', resp.data)), 1)

    def test_patient_sees_their_own_record_only(self):
        self.client.login(username='pat', password='pass')
        resp = self.client.get('/api/patients/patients/')
        self.assertEqual(resp.status_code, 200)
        data = resp.data.get('results', resp.data)
        # Patient should only see their own record
        self.assertEqual(len(data), 1)

    def test_patient_cannot_create_patient(self):
        self.client.login(username='pat', password='pass')
        resp = self.client.post('/api/patients/patients/', {'user': self.patient_user.id, 'date_of_birth': '1990-01-01', 'gender': 'F'})
        self.assertIn(resp.status_code, (400, 403))

    def test_provider_can_create_clinical_note(self):
        self.client.login(username='doc', password='pass')
        payload = {'patient': self.patient.id, 'subjective': 'X', 'objective': 'Y', 'assessment': 'Z', 'plan': 'A'}
        resp = self.client.post('/api/patients/clinical-notes/', payload)
        self.assertIn(resp.status_code, (201, 200))

    def test_patient_cannot_create_clinical_note(self):
        self.client.login(username='pat', password='pass')
        payload = {'patient': self.patient.id, 'subjective': 'X', 'objective': 'Y', 'assessment': 'Z', 'plan': 'A'}
        resp = self.client.post('/api/patients/clinical-notes/', payload)
        self.assertIn(resp.status_code, (400, 403))
