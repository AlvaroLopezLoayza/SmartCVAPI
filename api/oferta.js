import sql from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { id_usuario, titulo, descripcion, requisitos, salario } = req.body;

    if (!id_usuario || !titulo || !descripcion) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    // Obtener id_empresa usando id_usuario
    const [empresa] = await sql`
      SELECT id_empresa FROM empresa WHERE id_usuario = ${id_usuario}
    `;
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada para este usuario' });
    }
    const id_empresa = empresa.id_empresa;

    await sql`
      INSERT INTO ofertas_trabajo (id_empresa, titulo, descripcion, requisitos, salario)
      VALUES (${id_empresa}, ${titulo}, ${descripcion}, ${requisitos}, ${salario})
    `;

    res.status(201).json({ mensaje: 'Oferta registrada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar oferta', detalle: error.message });
  }
}