import sql from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'ID de usuario requerido' });
  }

  try {
    const ofertas = await sql`
      SELECT o.*, e.nombre AS empresa
      FROM ofertas_trabajo o
      JOIN empresa e ON o.id_empresa = e.id_empresa
      WHERE e.id_usuario = ${id_usuario}
    `;

    res.status(200).json(ofertas);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener ofertas del usuario',
      detalle: error.message
    });
  }
}
