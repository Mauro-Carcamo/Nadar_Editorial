# Generated by Django 4.2.2 on 2023-10-27 05:01

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Libro',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titulo', models.CharField(default='---', max_length=256)),
                ('estado', models.BooleanField(default=0)),
            ],
        ),
    ]