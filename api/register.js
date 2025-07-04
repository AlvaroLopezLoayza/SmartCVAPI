import sql from './db.js'
import bcrypt from 'bcryptjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    let body = '';
    for await (const chunk of req) body += chunk;
    const { correo, clave, tipo_usuario } = JSON.parse(body);

    if (!correo || !clave || !tipo_usuario) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si el correo ya está registrado
    const existe = await sql`SELECT 1 FROM usuarios WHERE correo = ${correo}`;
    if (existe.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Encriptar la clave antes de guardar
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(clave, salt);

    // Guardar usuario con clave encriptada
    await sql`
      INSERT INTO usuarios (correo, clave, tipo_usuario)
      VALUES (${correo}, ${hashedPassword}, ${tipo_usuario})
    `;

    return res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor', detalle: err.message });
  }
}
