from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not email:
            raise ValueError(_("The Email field must be set"))
        
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        
        return self.create_user(email, password, **extra_fields)


# Custom User Model
class CustomUser(AbstractUser, PermissionsMixin):
    username = None  # Remove username field
    email = models.EmailField(unique=True, verbose_name=_("Email Address"))

    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ['first_name', 'last_name']  # No username required

    def __str__(self):
        return self.email
    

#Sentiment analysis user form response
    
User = get_user_model()

class UserResponse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Associate with the custom user model
    response_text = models.TextField()  # Store the user's response to a sentiment-related question
    sentiment_score = models.FloatField()  # Store the sentiment intensity score
    ordinal_sentiment = models.CharField(max_length=50)  # Store ordinal sentiment like "Very Positive"
    created_at = models.DateTimeField(auto_now_add=True)  # Track when the response was created

    def __str__(self):
        return f"Response by {self.user.email} - {self.ordinal_sentiment}"    

User = get_user_model()

class UserSentimentScoreHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    average_intensity_score = models.FloatField()
    average_ordinal_sentiment = models.CharField(max_length=20)
    personal_sentiment_score = models.FloatField()  # Normalized score (0-1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.created_at}"