#!/bin/bash

# Crea un entorno virtual
echo "Creating a virtual environment..."
python3.9 -m venv venv
source venv/bin/activate

# Instala la última versión de pip
echo "Installing the latest version of pip..."
python -m pip install --upgrade pip

# Instala las dependencias del proyecto
echo "Installing project dependencies..."
python -m pip install -r requirements.txt

# Recolecta los archivos estáticos
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear