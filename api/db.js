import postgres from 'postgres';
const sql = postgres(connectionString, {
  ssl: 'require'
});

export default sql