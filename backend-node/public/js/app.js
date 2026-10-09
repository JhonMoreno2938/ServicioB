// ============================================
// SERVICIO B - GESTIÓN DE VIAJES (Frontend)
// ============================================

// ============================================
// 1. VALIDAR ACCESO (usuario + token)
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const USUARIO_URL = urlParams.get('usuario');
const TOKEN_URL = urlParams.get('token');

// Buscamos si ya hay una sesión guardada en esta pestaña
const USUARIO_SESION = sessionStorage.getItem('usuario');
const TOKEN_SESION = sessionStorage.getItem('token');

let usuarioFinal = null;
let tokenFinal = null;

if (TOKEN_URL && USUARIO_URL) {
    // ✅ Viene desde el Servicio A con credenciales en la URL
    usuarioFinal = USUARIO_URL;
    tokenFinal = TOKEN_URL;
    
    // Guardamos en sessionStorage para que al recargar la página no se pierda
    sessionStorage.setItem('usuario', usuarioFinal);
    sessionStorage.setItem('token', tokenFinal);
    
    console.log('✅ Acceso concedido desde el Servicio A:', usuarioFinal);
    
    // Limpiamos la URL para no dejar el token expuesto
    window.history.replaceState({}, document.title, window.location.pathname);
    
} else if (TOKEN_SESION && USUARIO_SESION) {
    // ✅ Ya tenía sesión activa en esta pestaña (recarga de página)
    usuarioFinal = USUARIO_SESION;
    tokenFinal = TOKEN_SESION;
    console.log('✅ Sesión recuperada:', usuarioFinal);
    
} else {
    // ❌ NO hay credenciales → Bloqueamos el acceso
    console.error('❌ Acceso denegado: no hay sesión activa');
    bloquearAcceso();
    throw new Error('Acceso denegado - Sin sesión');
}

// ============================================
// 2. FUNCIÓN PARA BLOQUEAR ACCESO
// ============================================
function bloquearAcceso() {
    document.body.innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="alert alert-danger text-center shadow">
                        <h2>🚫 Acceso Denegado</h2>
                        <p class="mt-3">
                            No tienes una sesión activa.<br>
                            Debes iniciar sesión desde el Panel Principal.
                        </p>
                        <a href="http://192.168.0.107/index.html" class="btn btn-primary mt-3">
                            🔐 Ir al Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// 3. MOSTRAR USUARIO EN LA BARRA SUPERIOR
// ============================================
const userTextElement = document.getElementById('nombreUsuarioText');
if (userTextElement) {
    userTextElement.innerText = usuarioFinal;
}

// ============================================
// 4. FUNCIÓN DE CERRAR SESIÓN (LOGOUT)
// ============================================
function cerrarSesion() {
    console.log('👋 Cerrando sesión desde el Servicio B...');

    // 1. Limpiamos el sessionStorage (credenciales locales del Servicio B)
    sessionStorage.clear();

    // 2. Intentamos limpiar también el localStorage del Servicio A
    //    (aunque es un dominio diferente, algunos navegadores lo permiten si es la misma IP)
    try {
        localStorage.clear();
    } catch (e) {
        console.warn('⚠️ No se pudo limpiar el localStorage de otro dominio');
    }

    // 3. Redirigimos al login del Servicio A
    window.location.href = 'http://192.168.0.107/index.html';
}

// ============================================
// 5. CARGAR CIUDADES
// ============================================
async function cargarCiudades() {
    try {
        const res = await fetch('/api/ciudades', {
            headers: {
                'Authorization': `Bearer ${tokenFinal}`
            }
        });
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
// 6. CARGAR VIAJES DEL USUARIO
// ============================================
async function cargarViajes() {
    try {
        const res = await fetch(`/api/viajes/${usuarioFinal}`, {
            headers: {
                'Authorization': `Bearer ${tokenFinal}`
            }
        });
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
        console.log(`✅ ${viajes.length} viajes cargados para ${usuarioFinal}`);
    } catch (err) {
        console.error('❌ Error cargando viajes:', err);
        document.getElementById('tablaViajesBody').innerHTML = 
            '<tr><td colspan="4" class="text-center text-danger">Error al cargar viajes</td></tr>';
    }
}

// ============================================
// 7. REGISTRAR NUEVO VIAJE
// ============================================
document.getElementById('viajeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        ciudad_id: document.getElementById('ciudadSelect').value,
        fecha_viaje: document.getElementById('fechaViaje').value,
        motivo: document.getElementById('motivo').value,
        usuario_uuid: usuarioFinal
    };

    try {
        const res = await fetch('/api/viajes', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenFinal}`
            },
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
// 8. INICIALIZAR PÁGINA
// ============================================
window.onload = () => {
    cargarCiudades();
    cargarViajes();
};