const { getDatabase } = require('./init');
const { getPostgresDatabase } = require('./postgres-init');

// Detectar qué base de datos usar
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');

function getDatabaseAdapter() {
  if (usePostgres) {
    return getPostgresDatabase();
  } else {
    return getDatabase();
  }
}

// Función helper para ejecutar consultas
async function executeQuery(query, params = []) {
  if (usePostgres) {
    const pool = getPostgresDatabase();
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({ rows });
        }
      });
    });
  }
}

// Función helper para ejecutar una sola fila
async function executeQuerySingle(query, params = []) {
  if (usePostgres) {
    const pool = getPostgresDatabase();
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return result.rows[0];
    } finally {
      client.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

// Función helper para ejecutar comandos (INSERT, UPDATE, DELETE)
async function executeCommand(query, params = []) {
  if (usePostgres) {
    const pool = getPostgresDatabase();
    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      return { lastID: result.rows[0]?.id, changes: result.rowCount };
    } finally {
      client.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
}

module.exports = {
  getDatabaseAdapter,
  executeQuery,
  executeQuerySingle,
  executeCommand,
  usePostgres
};
