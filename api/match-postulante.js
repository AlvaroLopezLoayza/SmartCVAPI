import sql from './db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { id_usuario } = req.query
  if (!id_usuario) {
    return res.status(400).json({ error: 'ID de usuario requerido' })
  }

  try {
    // Obtener CV del postulante
    const [cv] = await sql`
      SELECT * FROM cv_postulante WHERE id_usuario = ${id_usuario}
    `
    if (!cv) {
      return res.status(404).json({ error: 'CV no encontrado' })
    }

    // Obtener todas las ofertas con empresa incluida
    const ofertas = await sql`
      SELECT o.*, e.nombre AS empresa
      FROM ofertas_trabajo o
      JOIN empresa e ON o.id_empresa = e.id_empresa
    `
    if (ofertas.length === 0) {
      return res.status(404).json({ error: 'No hay ofertas registradas' })
    }

    // Armar el prompt para Gemini
    const prompt = `
Eres un sistema experto en emparejamiento laboral. A continuación tienes el CV de un postulante y varias ofertas de trabajo. Tu tarea es recomendar las 3 ofertas más adecuadas para este perfil, explicando brevemente por qué.

CV:
Nombre: ${cv.nombre_completo}
Experiencia: ${cv.experiencia}
Educación: ${cv.educacion}
Habilidades: ${cv.habilidades}
Resumen: ${cv.resumen_profesional}

Ofertas:
${ofertas.map((o, i) => `Oferta ${i + 1}:
Empresa: ${o.empresa}
Título: ${o.titulo}
Descripción: ${o.descripcion}
Requisitos: ${o.requisitos}
Ubicación: ${o.ubicacion}
Salario: ${o.salario}`).join('\n\n')}
    `.trim()

    // Llamada a Gemini con fetch
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    const result = await geminiRes.json()
    const texto = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Extraer las 3 ofertas recomendadas del texto de Gemini
    // Se asume que Gemini responde con bloques tipo:
    // Oferta 1:
    // Empresa: ...
    // Título: ...
    // Ubicación: ...
    // Requisitos: ...
    // Puntaje de afinidad: ...%

    // Regex para capturar los datos de cada oferta recomendada
    const regex = /Oferta \d+:\s*Empresa: (.+)\s*Título: (.+)\s*Ubicación: (.+)\s*Requisitos: (.+)\s*Puntaje de afinidad: (\d+)%/g
    let match
    const recomendaciones = []

    while ((match = regex.exec(texto)) !== null) {
      recomendaciones.push({
        nombre_empresa: match[1].trim(),
        titulo: match[2].trim(),
        ubicacion: match[3].trim(),
        requisitos: match[4].trim(),
        score_match: Number(match[5])
      })
    }

    res.status(200).json({ recomendaciones })
  } catch (error) {
    res.status(500).json({
      error: 'Error al generar recomendaciones',
      detalle: error.message
    })
  }
}