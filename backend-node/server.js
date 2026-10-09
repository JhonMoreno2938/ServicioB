const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Servir los archivos estáticos de la carpeta public (HTML, CSS, JS del frontend)
// Nota: Si mueves el Dockerfile dentro de backend-node, asegúrate de que la carpeta 'public' 
// esté dentro de 'backend-node' o ajusta esta ruta.
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la conexión a MySQL (Servidor Debian / Dokploy)
const pool = mysql.createPool({
    // IMPORTANTE: Si corres esto en Docker, '192.168.0.107' puede no ser accesible.
    // En Windows/Mac usa 'host.docker.internal'. En Linux usa la IP de tu host o el nombre del servicio.
    host: '192.168.0.107', 
    port: 3307,
    user: 'root',
    password: 'admin',
    database: 'prueba',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- RUTAS DE CIUDADES ---

// Obtener todas las ciudades cargadas (CORREGIDO: prefijo /api)
app.get('/api/ciudades', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ciudad');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las ciudades' });
    }
});

// --- RUTAS DE VIAJES ---

// Registrar un nuevo viaje (CORREGIDO: prefijo /api y lectura desde req.body)
app.post('/api/viajes', async (req, res) => {
    try {
        // Leemos todo directamente del body, que es como lo envía el index.html
        const { ciudad_id, fecha_viaje, motivo, usuario_uuid } = req.body;

        if (!usuario_uuid) {
            return res.status(401).json({ error: 'No se encontró el UUID del usuario en la petición' });
        }

        if (!ciudad_id || !fecha_viaje) {
            return res.status(400).json({ error: 'Faltan campos obligatorios (ciudad_id, fecha_viaje)' });
        }

        const query = 'INSERT INTO viaje (usuario_uuid, ciudad_id, fecha_viaje, motivo) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(query, [usuario_uuid, ciudad_id, fecha_viaje, motivo || '']);

        res.status(201).json({ 
            message: 'Viaje registrado con éxito', 
            viaje_id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el viaje' });
    }
});

// Obtener los viajes de un usuario específico usando su UUID (CORREGIDO: prefijo /api)
app.get('/api/viajes/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;

        const query = `
            SELECT v.id, c.nombre AS ciudad, c.pais, v.fecha_viaje, v.motivo 
            FROM viaje v
            JOIN ciudad c ON v.ciudad_id = c.id
            WHERE v.usuario_uuid = ?
        `;
        const [rows] = await pool.query(query, [uuid]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar los viajes' });
    }
});

// Iniciar servidor (CORREGIDO: usar variable de entorno para Docker)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});