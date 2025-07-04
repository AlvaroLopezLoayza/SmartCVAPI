import sql from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id_oferta } = req.body;
    const oferta = await sql`SELECT * FROM ofertas_trabajo WHERE id_oferta = ${id_oferta}`;
    if (oferta.length === 0) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    const cvs = await sql`SELECT * FROM cv_postulante`;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const resultados = [];

    for (const cv of cvs) {
      const prompt = `
        Dado el siguiente requerimiento de una oferta laboral:
        ${oferta[0].requisitos}

        Y el siguiente CV:
        ${cv.resumen_profesional}
        Habilidades: ${cv.habilidades}
        Educación: ${cv.educacion}
        Experiencia: ${cv.experiencia}

        Evalúa de 0 a 100 qué tan bien se ajusta el CV al perfil requerido. Devuelve solo el número.
      `;

      const response = await model.generateContent(prompt);
      const score = parseFloat(response.response.text.trim());
      resultados.push({ id_cv: cv.id_cv, score });
    }

    // (Opcional) Guardar en tabla de matches
    for (const r of resultados) {
      await sql`
        INSERT INTO matches (id_cv, id_oferta, score_match)
        VALUES (${r.id_cv}, ${id_oferta}, ${r.score})
        ON CONFLICT (id_cv, id_oferta) DO UPDATE SET score_match = EXCLUDED.score_match
      `;
    }

    res.status(200).json(resultados);
  } catch (err) {
    res.status(500).json({ error: 'Error al generar recomendaciones', detalle: err.message });
  }
}