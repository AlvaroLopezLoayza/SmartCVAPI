import sql from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id_usuario } = req.query;

      if (!id_usuario) {
        return res.status(400).json({ error: 'Falta el parámetro id_usuario' });
      }

      const resultado = await sql`
        SELECT * FROM cv_postulante WHERE id_usuario = ${id_usuario}
      `;

      if (resultado.length === 0) {
        return res.status(404).json({ error: 'CV no encontrado para este usuario' });
      }

      return res.status(200).json(resultado[0]);
    }

    if (req.method === 'POST') {
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
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor', detalle: error.message });
  }
}
