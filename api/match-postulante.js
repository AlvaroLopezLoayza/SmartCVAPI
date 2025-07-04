import sql from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ error: 'ID de usuario requerido' });

  try {
    const [cv] = await sql`SELECT * FROM cv_postulante WHERE id_usuario = ${id_usuario}`;
    const ofertas = await sql`
      SELECT o.*, e.nombre AS empresa
      FROM oferta_laboral o
      JOIN empresa e ON o.id_empresa = e.id_empresa
    `;

    if (!cv) return res.status(404).json({ error: 'CV no encontrado' });

    const prompt = `
      Eres un sistema de emparejamiento laboral. A partir del siguiente CV:

      CV:
      Nombre: ${cv.nombre_completo}
      Experiencia: ${cv.experiencia}
      Educación: ${cv.educacion}
      Habilidades: ${cv.habilidades}
      Resumen: ${cv.resumen_profesional}

      Evalúa las siguientes ofertas y recomienda las 3 más adecuadas explicando por qué:

      ${ofertas.map(o => `Título: ${o.titulo}\nRequisitos: ${o.requisitos}\nDescripción: ${o.descripcion}\nSalario: ${o.salario}\n`).join('\n---\n')}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    res.status(200).json({ recomendaciones: content });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar recomendaciones', detalle: error.message });
  }
}
