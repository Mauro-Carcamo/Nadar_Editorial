from django import forms
from .models import Libro

class LibroForm(forms.ModelForm):
    class Meta:
        model = Libro
        fields = ['titulo']
        # Validación del título
        # El título no puede estar vacío
        titulo = forms.CharField(
            required=True,
            max_length=255,
            label='Título'
        )
