import sql from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { id_oferta } = req.query;
  if (!id_oferta) return res.status(400).json({ error: 'ID de oferta requerido' });

  try {
    const [oferta] = await sql`SELECT * FROM oferta_laboral WHERE id_oferta = ${id_oferta}`;
    const cvs = await sql`SELECT * FROM cv_postulante`;

    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });

    const prompt = `
      Eres un sistema de emparejamiento laboral. Evalúa los siguientes CVs y recomienda los 3 mejores para esta oferta:

      Oferta:
      Título: ${oferta.titulo}
      Requisitos: ${oferta.requisitos}
      Descripción: ${oferta.descripcion}

      CVs:
      ${cvs.map(c => `Nombre: ${c.nombre_completo}\nExperiencia: ${c.experiencia}\nEducación: ${c.educacion}\nHabilidades: ${c.habilidades}\nResumen: ${c.resumen_profesional}`).join('\n---\n')}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    res.status(200).json({ recomendaciones: content });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar recomendaciones', detalle: error.message });
  }
}
