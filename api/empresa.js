import sql from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { id_usuario, nombre, rubro, descripcion } = req.body;

    if (!id_usuario || !nombre || !rubro) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const yaExiste = await sql`
      SELECT 1 FROM empresa WHERE id_usuario = ${id_usuario}
    `;
    if (yaExiste.length > 0) {
      return res.status(400).json({ error: 'Este usuario ya tiene una empresa registrada' });
    }

    await sql`
      INSERT INTO empresa (id_usuario, nombre, rubro, descripcion)
      VALUES (${id_usuario}, ${nombre}, ${rubro}, ${descripcion})
    `;

    res.status(201).json({ mensaje: 'Empresa registrada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar empresa', detalle: error.message });
  }
}
