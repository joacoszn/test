#!/bin/bash

# Script de inicio para THC Growshop
# Autor: THC Growshop Development Team

echo "🌱 THC Growshop - Iniciando servidor de desarrollo"
echo "================================================="

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 no está instalado. Por favor instala Python 3."
    exit 1
fi

# Verificar si estamos en el directorio correcto
if [ ! -f "live-server.py" ]; then
    echo "❌ No se encontró live-server.py. Asegúrate de estar en el directorio correcto."
    exit 1
fi

# Mostrar información del proyecto
echo "📋 Información del proyecto:"
echo "   - Nombre: THC Growshop"
echo "   - Puerto: 8080"
echo "   - URL: http://localhost:8080"
echo ""

# Limpiar la pantalla en 2 segundos
sleep 2
clear

# Ejecutar el servidor
echo "🚀 Iniciando servidor..."
python3 live-server.py
