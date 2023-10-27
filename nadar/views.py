from django.http import HttpResponseRedirect
from nadar.models import Libro # Importar el modelo
from .forms import LibroForm 
from django.shortcuts import render


def v_index(request):
    if request.method == 'POST':
        _titulo = request.POST["titulo"]
        libro = Libro()
        libro.titulo = _titulo
        libro.save()
        return HttpResponseRedirect("/")

    else:
        consulta = Libro.objects.filter(titulo__icontains = request.GET.get("titulo",""))
    
        context = {
            'var1': 'Valor1',
            'var2': 'Valorasdasdasdasdasd',
            'lista': consulta
            }
        return render(request, 'base.html',context)