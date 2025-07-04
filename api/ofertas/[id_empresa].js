import sql from '../db.js';

export default async function handler(req, res) {
  const { id_empresa } = req.query;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const ofertas = await sql`
      SELECT * FROM oferta_laboral WHERE id_empresa = ${id_empresa}
    `;
    res.status(200).json(ofertas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ofertas', detalle: error.message });
  }
}
