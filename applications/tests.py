from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Application
from .serializers import ApplicationSerializer


class ApplicationSerializerTests(TestCase):
    def test_serializer_includes_id_and_created_at(self):
        user = get_user_model().objects.create_user(
            username="resident",
            email="resident@example.com",
            password="pass1234",
        )
        application = Application.objects.create(
            user=user,
            application_type="NEW_ID",
            status="PENDING",
            full_name="Test User",
        )

        data = ApplicationSerializer(application).data

        self.assertIn("id", data)
        self.assertIn("created_at", data)


class ApplicationApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="resident2",
            email="resident2@example.com",
            password="pass1234",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_user_can_delete_their_application(self):
        application = Application.objects.create(
            user=self.user,
            application_type="ID_RENEWAL",
            status="PENDING",
            full_name="Delete Me",
        )

        response = self.client.delete(f"/api/v1/applications/{application.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Application.objects.filter(pk=application.pk).exists())
