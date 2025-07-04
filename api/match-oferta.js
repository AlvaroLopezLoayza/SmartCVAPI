import sql from './db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    let body = ''
    for await (const chunk of req) body += chunk
    const { id_oferta } = JSON.parse(body)

    if (!id_oferta) {
      return res.status(400).json({ error: 'Falta el id de la oferta' })
    }

    // 1. Obtener la descripción de la oferta
    const oferta = await sql`
      SELECT descripcion FROM ofertas_trabajo WHERE id_oferta = ${id_oferta}
    `
    if (oferta.length === 0) {
      return res.status(404).json({ error: 'Oferta no encontrada' })
    }

    const descripcionOferta = oferta[0].descripcion

    // 2. Obtener todos los CVs
    const cvs = await sql`
      SELECT id_cv, resumen_profesional FROM cv_postulante
    `

    // 3. Enviar la descripción + cada CV al modelo para obtener una puntuación
    const resultados = []
    for (const cv of cvs) {
      const prompt = `Evalúa la compatibilidad entre esta oferta de trabajo: "${descripcionOferta}" y este CV: "${cv.resumen_profesional}". Devuelve un puntaje entre 0 y 100 sin explicaciones.`
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      })

      const result = await response.json()
      const texto = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const puntuacion = parseFloat(texto.match(/\d+/)?.[0]) || 0

      resultados.push({
        id_cv: cv.id_cv,
        score_match: puntuacion
      })

      // (opcional) guardar en tabla de matches
      await sql`
        INSERT INTO matches (id_cv, id_oferta, score_match)
        VALUES (${cv.id_cv}, ${id_oferta}, ${puntuacion})
      `
    }

    return res.status(200).json({ resultados })

  } catch (err) {
    return res.status(500).json({
      error: 'Error al generar recomendaciones',
      detalle: err.message
    })
  }
}