import sql from './db.js'

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

    // 1. Verificar si el correo ya existe
    const existe = await sql`
      SELECT 1 FROM usuarios WHERE correo = ${correo}
    `;
    if (existe.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // 2. Insertar nuevo usuario
    await sql`
      INSERT INTO usuarios (correo, clave, tipo_usuario)
      VALUES (${correo}, ${clave}, ${tipo_usuario})
    `;

    return res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor', detalle: err.message });
  }
}
