import sql from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { correo, clave } = req.body;

    if (!correo || !clave) {
      return res.status(400).json({ error: 'Correo y clave requeridos' });
    }

    const [usuario] = await sql`
      SELECT * FROM usuarios WHERE correo = ${correo}
    `;

    if (!usuario || !(await bcrypt.compare(clave, usuario.clave))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Puedes implementar JWT o sesiones aquí. Por ahora, devolvemos los datos básicos.
    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        tipo_usuario: usuario.tipo_usuario
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
}
