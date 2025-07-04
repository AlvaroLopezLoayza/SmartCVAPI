import sql from '../db.js'; // O ajusta la ruta según sea necesario

export default async function handler(req, res) {
  const { id_usuario } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const [cv] = await sql`
      SELECT * FROM cv_postulante WHERE id_usuario = ${id_usuario}
    `;

    if (!cv) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }

    res.status(200).json(cv);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
}
