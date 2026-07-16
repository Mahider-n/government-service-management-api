from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_admin = serializers.SerializerMethodField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'phone_number', 'address', 'profile_picture', 'password', 'is_admin', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'is_admin', 'is_staff', 'is_superuser']

    def get_is_admin(self, obj):
        return bool(obj.is_admin or obj.is_staff or obj.is_superuser)

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
    def update(self, instance, validated_data):
        # if password is included, hash it before saving
        password = validated_data.pop('password', None)
        if password:
            instance.password = make_password(password)
        return super().update(instance, validated_data)
