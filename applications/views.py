from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from .models import Application
from .serializers import ApplicationSerializer
from .utils import send_status_update_email
from rest_framework.exceptions import PermissionDenied

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
        instance = self.get_object()
        user = self.request.user

    # Store the old status before update
        old_status = instance.status  

    # Residents: can only update if status is Pending
        if not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or getattr(user, 'is_admin', False)) and instance.status != "PENDING":
            raise PermissionDenied("You can only update while application is pending.")

    # Save the updated data
        updated_instance = serializer.save()

    # Send email if admin changed the status
        if user.is_staff and old_status != updated_instance.status:
            send_status_update_email(updated_instance)
