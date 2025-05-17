from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = CustomUser
        fields = ["id", "email", "password", "first_name", "last_name", "is_admin"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        validated_data.pop("username", None)  # Ensure username is removed
        user = CustomUser.objects.create_user(**validated_data)
        return user
