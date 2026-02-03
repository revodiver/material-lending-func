import * as sql from 'mssql';

const config: sql.config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

export async function query<T>(queryText: string, params?: Record<string, any>): Promise<T[]> {
  const connection = await getConnection();
  const request = connection.request();

  if (params) {
    Object.keys(params).forEach((key) => {
      request.input(key, params[key]);
    });
  }

  const result = await request.query(queryText);
  return result.recordset;
}

export async function executeTransaction<T>(
  transactionFunc: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const connection = await getConnection();
  const transaction = new sql.Transaction(connection);
  
  try {
    await transaction.begin();
    const result = await transactionFunc(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export { sql };
