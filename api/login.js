import sql from './db.js'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { correo, clave } = JSON.parse(body);

    if (!correo || !clave) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const result = await sql`
      SELECT * FROM usuarios WHERE correo = ${correo}
    `;

    if (result.length === 0) {
      return res.status(401).json({ error: 'Correo no registrado' });
    }

    const usuario = result[0];
    const claveValida = bcrypt.compareSync(clave, usuario.clave);

    if (!claveValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        tipo_usuario: usuario.tipo_usuario
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor', detalle: err.message });
  }
}
