# Generated by Django 5.1.6 on 2025-05-03 09:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_admin',
            field=models.BooleanField(default=False, verbose_name='Admin User'),
        ),
    ]
