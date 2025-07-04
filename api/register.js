import sql from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { correo, clave, tipo_usuario } = req.body;

    if (!correo || !clave || !['postulante', 'reclutador'].includes(tipo_usuario)) {
      return res.status(400).json({ error: 'Datos incompletos o inválidos' });
    }

    const hashedPassword = await bcrypt.hash(clave, 10);

    const [usuario] = await sql`
      INSERT INTO usuarios (correo, clave, tipo_usuario)
      VALUES (${correo}, ${hashedPassword}, ${tipo_usuario})
      RETURNING id_usuario, correo, tipo_usuario
    `;

    res.status(201).json({ mensaje: 'Usuario registrado', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
}
