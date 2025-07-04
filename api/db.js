import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno")
}

const sql = postgres(connectionString, { ssl: 'require' })

export default sql
