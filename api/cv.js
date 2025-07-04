import sql from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const {
      id_usuario,
      nombre_completo,
      experiencia,
      educacion,
      habilidades,
      resumen_profesional
    } = req.body;

    if (!id_usuario || !nombre_completo) {
      return res.status(400).json({ error: 'Datos requeridos incompletos' });
    }

    const existe = await sql`
      SELECT 1 FROM cv_postulante WHERE id_usuario = ${id_usuario}
    `;

    if (existe.length > 0) {
      await sql`
        UPDATE cv_postulante SET
          nombre_completo = ${nombre_completo},
          experiencia = ${experiencia},
          educacion = ${educacion},
          habilidades = ${habilidades},
          resumen_profesional = ${resumen_profesional}
        WHERE id_usuario = ${id_usuario}
      `;
      return res.status(200).json({ mensaje: 'CV actualizado' });
    } else {
      await sql`
        INSERT INTO cv_postulante (
          id_usuario, nombre_completo, experiencia, educacion, habilidades, resumen_profesional
        ) VALUES (
          ${id_usuario}, ${nombre_completo}, ${experiencia}, ${educacion}, ${habilidades}, ${resumen_profesional}
        )
      `;
      return res.status(201).json({ mensaje: 'CV creado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
}
