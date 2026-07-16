from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.response import Response

from .models import Application
from .serializers import ApplicationSerializer
from .utils import send_status_update_email

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin', False):
            return True
        return obj.user == request.user  # resident

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'is_admin', False):
            return Application.objects.all()
        return Application.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        old_status = instance.status

        if not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'is_admin', False)) and instance.status != "PENDING":
            raise PermissionDenied("You can only update while application is pending.")

        updated_instance = serializer.save()

        if (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'is_admin', False)) and old_status != updated_instance.status:
            send_status_update_email(updated_instance)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except NotFound:
            raise NotFound("Application not found.")

        if not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False) or getattr(request.user, 'is_admin', False)) and instance.user != request.user:
            raise PermissionDenied("You can only delete your own application.")

        self.perform_destroy(instance)
        return Response(status=204)
