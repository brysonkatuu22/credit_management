from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'date_joined', 'is_active')  # Customize displayed fields
    search_fields = ('email',)
    ordering = ('-date_joined',)
