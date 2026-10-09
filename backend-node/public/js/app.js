// ============================================
// SERVICIO B - GESTIÓN DE VIAJES (Frontend)
// ============================================

// ============================================
// 1. OBTENER USUARIO DESDE LA URL
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const USUARIO_ACTUAL = urlParams.get('usuario');

if (!USUARIO_ACTUAL) {
    console.error('❌ No se recibió el usuario en la URL');
    const userText = document.getElementById('nombreUsuarioText');
    if (userText) {
        userText.innerHTML = '<span class="text-danger">Error: Usuario no identificado</span>';
    }
    
    // Redirigir al login del Servicio A después de 3 segundos
    setTimeout(() => {
        window.location.href = 'http://192.168.0.107/index.html';
    }, 3000);
} else {
    console.log('✅ Usuario recibido:', USUARIO_ACTUAL);
    const userText = document.getElementById('nombreUsuarioText');
    if (userText) {
        userText.innerText = USUARIO_ACTUAL;
    }
}

// ============================================
// 2. CARGAR CIUDADES
// ============================================
async function cargarCiudades() {
    try {
        const res = await fetch('/api/ciudades');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const ciudades = await res.json();
        const select = document.getElementById('ciudadSelect');
        select.innerHTML = '<option value="">Seleccione una ciudad...</option>';
        
        ciudades.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${c.nombre} (${c.pais})</option>`;
        });
        console.log(`✅ ${ciudades.length} ciudades cargadas`);
    } catch (err) {
        console.error('❌ Error cargando ciudades:', err);
        document.getElementById('ciudadSelect').innerHTML = 
            '<option value="">Error al cargar ciudades</option>';
    }
}

// ============================================
// 3. CARGAR VIAJES DEL USUARIO
// ============================================
async function cargarViajes() {
    if (!USUARIO_ACTUAL) return;
    
    try {
        const res = await fetch(`/api/viajes/${USUARIO_ACTUAL}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const viajes = await res.json();
        const tbody = document.getElementById('tablaViajesBody');
        tbody.innerHTML = '';

        if (viajes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay viajes registrados para este usuario.</td></tr>';
            return;
        }

        viajes.forEach(v => {
            const fechaMostrar = v.fecha_viaje ? v.fecha_viaje.split('T')[0] : 'N/A';
            tbody.innerHTML += `
                <tr>
                    <td>${v.ciudad}</td>
                    <td>${v.pais}</td>
                    <td>${fechaMostrar}</td>
                    <td>${v.motivo || '-'}</td>
                </tr>
            `;
        });
        console.log(`✅ ${viajes.length} viajes cargados para ${USUARIO_ACTUAL}`);
    } catch (err) {
        console.error('❌ Error cargando viajes:', err);
        document.getElementById('tablaViajesBody').innerHTML = 
            '<tr><td colspan="4" class="text-center text-danger">Error al cargar viajes</td></tr>';
    }
}

// ============================================
// 4. REGISTRAR NUEVO VIAJE
// ============================================
document.getElementById('viajeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!USUARIO_ACTUAL) {
        alert('Error: No hay usuario identificado');
        return;
    }

    const data = {
        ciudad_id: document.getElementById('ciudadSelect').value,
        fecha_viaje: document.getElementById('fechaViaje').value,
        motivo: document.getElementById('motivo').value,
        usuario_uuid: USUARIO_ACTUAL
    };

    try {
        const res = await fetch('/api/viajes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert('¡Viaje registrado con éxito!');
            document.getElementById('viajeForm').reset();
            cargarViajes();
        } else {
            const errorData = await res.json();
            alert(`Error al registrar el viaje: ${errorData.error || 'Desconocido'}`);
        }
    } catch (err) {
        console.error('❌ Error al enviar el formulario:', err);
        alert('Error de conexión al registrar el viaje');
    }
});

// ============================================
// 5. INICIALIZAR PÁGINA
// ============================================
window.onload = () => {
    cargarCiudades();
    cargarViajes();
};