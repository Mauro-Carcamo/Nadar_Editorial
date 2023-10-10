from django.shortcuts import render


def v_index(request):
    context = {

    }
    return render(request, 'index.html',context)
