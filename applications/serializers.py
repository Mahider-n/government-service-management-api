from rest_framework import serializers
from .models import Application
from PIL import Image

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = "__all__"
        read_only_fields = ["user"]

    # --- VALIDATIONS ---
    def validate_photo(self, value):
        # Ensure image is within 1x1 inch to 2x2 inch (300-600 px)
        img = Image.open(value)
        width, height = img.size
        if width < 300 or height < 300:
            raise serializers.ValidationError(
                "Photo must be between 1x1 inch (300x300 px) and 2x2 inch (600x600 px)."
            )
        return value

    def validate_residence_proof(self, value):
        # Ensure file is PDF
        if not value.name.endswith(".pdf"):
            raise serializers.ValidationError("Residence proof must be a PDF file.")
        return value

    # --- CONDITIONAL REQUIRED FIELDS ---
    def validate(self, attrs):
        app_type = attrs.get('application_type')

        if app_type == "NEW_ID":
            if 'photo' not in attrs or not attrs['photo']:
                raise serializers.ValidationError({"photo": "Photo is required for NEW_ID applications."})
            if 'residence_proof' not in attrs or not attrs['residence_proof']:
                raise serializers.ValidationError({"residence_proof": "Residence proof is required for NEW_ID applications."})
            
        elif app_type == "ID_RENEWAL":
            if 'photo' not in attrs or not attrs['photo']:
                raise serializers.ValidationError({"photo": "Photo is required for ID_RENEWAL applications."})
            if 'old_id_card' not in attrs or not attrs['old_id_card']:
                raise serializers.ValidationError({"old_id_card": "Old ID card is required for ID_RENEWAL applications."})
        elif app_type == "BIRTH_CERTIFICATE":
            if 'hospital_proof' not in attrs or not attrs['hospital_proof']:
                raise serializers.ValidationError({"hospital_proof": "Hospital proof is required for BIRTH_CERTIFICATE applications."})
            if 'parent_id' not in attrs or not attrs['parent_id']:
                raise serializers.ValidationError({"parent_id": "At lest one parent's ID is required for BIRTH_CERTIFICATE applications."})
            if 'birth_certificate_photo' not in attrs or not attrs['birth_certificate_photo']:
                raise serializers.ValidationError({"birth_certificate_photo": "A birth certificate photo is required for BIRTH_CERTIFICATE applications."})

        # You can add similar logic for ID_RENEWAL and BIRTH_CERTIFICATE if needed
        return attrs

    # --- CREATE ---
    def create(self, validated_data):
        user = self.context["request"].user
        # Rule: one active application at a time
        if Application.objects.filter(user=user, status="PENDING").exists():
            raise serializers.ValidationError("You already have a pending application.")
        validated_data["user"] = user
        return super().create(validated_data)

    # --- DYNAMIC OUTPUT ---
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        app_type = instance.application_type

        if app_type == "NEW_ID":
            allowed = [
                "id", "application_type", "full_name", "dob", "gender",
                "blood_group", "resident_address", "phone_number",
                "emergency_contact_name", "emergency_contact_phone",
                "photo", "residence_proof", "status", "created_at"
            ]
        elif app_type == "ID_RENEWAL":
            allowed = [
                "id", "application_type", "existing_id_number", "full_name",
                "dob", "resident_address", "phone_number", "reason_for_renewal",
                "old_id_card", "photo", "status", "created_at"
            ]
        elif app_type == "BIRTH_CERTIFICATE":
            allowed = [
                "id", "application_type", "child_full_name", "dob", "place_of_birth",
                "gender", "father_full_name", "mother_full_name",
                "resident_address", "phone_number", "hospital_proof", "birth_certificate_photo", "parent_id", "status", "created_at"
            ]
        else:
            allowed = ret.keys()  # fallback

        return {key: ret[key] for key in allowed if key in ret}
