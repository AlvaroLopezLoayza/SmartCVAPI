import sql from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const ofertas = await sql`
      SELECT o.*, e.nombre AS empresa
      FROM oferta_laboral o
      JOIN empresa e ON o.id_empresa = e.id_empresa
    `;
    res.status(200).json(ofertas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ofertas', detalle: error.message });
  }
}
