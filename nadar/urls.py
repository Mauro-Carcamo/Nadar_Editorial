from .views import v_index
from django.urls import path

urlpatterns = [
path('', v_index)
]