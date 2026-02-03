import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query, getConnection, sql } from '../lib/database';

interface Loan {
  LoanId: number;
  PersonId: number;
  EquipmentId: number;
  BorrowedAt: Date;
  BorrowFeedback: string;
  ReturnedAt: Date | null;
  ReturnFeedback: string;
}

interface LoanWithDetails extends Loan {
  PersonName: string;
  PersonSurname: string;
  EquipmentName: string;
  CategoryName: string;
  Brand: string;
  ItemNumber: string;
}

interface CreateLoanRequest {
  PersonId: number;
  EquipmentId: number;
  BorrowFeedback?: string;
}

interface ReturnLoanRequest {
  ReturnFeedback?: string;
}

interface BatchReturnRequest {
  LoanIds: number[];
  ReturnFeedback?: string;
}

// GET /api/loans - Get all loans
async function getAllLoans(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const loans = await query<Loan>('SELECT * FROM Loans ORDER BY BorrowedAt DESC');
    return {
      status: 200,
      jsonBody: loans,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching loans:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch loans' },
    };
  }
}

// GET /api/loans/{id} - Get loan by ID
async function getLoanById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      return {
        status: 400,
        jsonBody: { error: 'Loan ID is required' },
      };
    }

    const loans = await query<Loan>(
      'SELECT * FROM Loans WHERE LoanId = @id',
      { id }
    );

    if (loans.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Loan not found' },
      };
    }

    return {
      status: 200,
      jsonBody: loans[0],
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching loan:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch loan' },
    };
  }
}

// GET /api/loans/active - Get active loans with details
async function getActiveLoans(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const loans = await query<LoanWithDetails>(`
      SELECT 
        l.*,
        p.Name AS PersonName,
        p.Surname AS PersonSurname,
        e.Name AS EquipmentName,
        e.CategoryName,
        e.Brand,
        e.ItemNumber
      FROM Loans l
      INNER JOIN Persons p ON l.PersonId = p.PersonId
      INNER JOIN Equipment e ON l.EquipmentId = e.EquipmentId
      WHERE l.ReturnedAt IS NULL
      ORDER BY l.BorrowedAt DESC
    `);
    return {
      status: 200,
      jsonBody: loans,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching active loans:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch active loans' },
    };
  }
}

// GET /api/loans/person/{personId} - Get loans by person with details
async function getLoansByPerson(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const personId = request.params.personId;
    if (!personId) {
      return {
        status: 400,
        jsonBody: { error: 'Person ID is required' },
      };
    }

    const loans = await query<LoanWithDetails>(
      `
      SELECT 
        l.*,
        p.Name AS PersonName,
        p.Surname AS PersonSurname,
        e.Name AS EquipmentName,
        e.CategoryName,
        e.Brand,
        e.ItemNumber
      FROM Loans l
      INNER JOIN Persons p ON l.PersonId = p.PersonId
      INNER JOIN Equipment e ON l.EquipmentId = e.EquipmentId
      WHERE l.PersonId = @personId
      ORDER BY l.BorrowedAt DESC
      `,
      { personId }
    );

    return {
      status: 200,
      jsonBody: loans,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching loans by person:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch loans by person' },
    };
  }
}

// GET /api/loans/person/{personId}/active - Get active loans by person
async function getActiveLoansByPerson(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const personId = request.params.personId;
    if (!personId) {
      return {
        status: 400,
        jsonBody: { error: 'Person ID is required' },
      };
    }

    const loans = await query<LoanWithDetails>(
      `
      SELECT 
        l.*,
        p.Name AS PersonName,
        p.Surname AS PersonSurname,
        e.Name AS EquipmentName,
        e.CategoryName,
        e.Brand,
        e.ItemNumber
      FROM Loans l
      INNER JOIN Persons p ON l.PersonId = p.PersonId
      INNER JOIN Equipment e ON l.EquipmentId = e.EquipmentId
      WHERE l.PersonId = @personId AND l.ReturnedAt IS NULL
      ORDER BY l.BorrowedAt DESC
      `,
      { personId }
    );

    return {
      status: 200,
      jsonBody: loans,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching active loans by person:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch active loans by person' },
    };
  }
}

// POST /api/loans - Create a new loan
async function createLoan(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as CreateLoanRequest;

    if (!body.PersonId || !body.EquipmentId) {
      return {
        status: 400,
        jsonBody: { error: 'PersonId and EquipmentId are required' },
      };
    }

    const connection = await getConnection();
    const result = await connection.request()
      .input('PersonId', sql.Int, body.PersonId)
      .input('EquipmentId', sql.Int, body.EquipmentId)
      .input('BorrowFeedback', sql.NVarChar, body.BorrowFeedback || '')
      .input('BorrowedAt', sql.DateTime, new Date())
      .query(`
        INSERT INTO Loans (PersonId, EquipmentId, BorrowedAt, BorrowFeedback)
        OUTPUT INSERTED.*
        VALUES (@PersonId, @EquipmentId, @BorrowedAt, @BorrowFeedback)
      `);

    // Update equipment availability
    await connection.request()
      .input('EquipmentId', sql.Int, body.EquipmentId)
      .query('UPDATE Equipment SET IsAvailable = 0 WHERE EquipmentId = @EquipmentId');

    return {
      status: 201,
      jsonBody: result.recordset[0],
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error creating loan:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to create loan' },
    };
  }
}

// POST /api/loans/batch - Create multiple loans
async function createBatchLoans(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as CreateLoanRequest[];

    if (!Array.isArray(body) || body.length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'Array of loans is required' },
      };
    }

    const connection = await getConnection();
    const createdLoans = [];

    for (const loan of body) {
      if (!loan.PersonId || !loan.EquipmentId) {
        return {
          status: 400,
          jsonBody: { error: 'PersonId and EquipmentId are required for all loans' },
        };
      }

      const result = await connection.request()
        .input('PersonId', sql.Int, loan.PersonId)
        .input('EquipmentId', sql.Int, loan.EquipmentId)
        .input('BorrowFeedback', sql.NVarChar, loan.BorrowFeedback || '')
        .input('BorrowedAt', sql.DateTime, new Date())
        .query(`
          INSERT INTO Loans (PersonId, EquipmentId, BorrowedAt, BorrowFeedback)
          OUTPUT INSERTED.*
          VALUES (@PersonId, @EquipmentId, @BorrowedAt, @BorrowFeedback)
        `);

      // Update equipment availability
      await connection.request()
        .input('EquipmentId', sql.Int, loan.EquipmentId)
        .query('UPDATE Equipment SET IsAvailable = 0 WHERE EquipmentId = @EquipmentId');

      createdLoans.push(result.recordset[0]);
    }

    return {
      status: 201,
      jsonBody: createdLoans,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error creating batch loans:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to create batch loans' },
    };
  }
}

// PATCH /api/loans/{loanId}/return - Return a loan
async function returnLoan(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const loanId = request.params.loanId;
    if (!loanId) {
      return {
        status: 400,
        jsonBody: { error: 'Loan ID is required' },
      };
    }

    const body = await request.json() as ReturnLoanRequest;
    const connection = await getConnection();

    // Get the equipment ID before updating
    const loanResult = await connection.request()
      .input('LoanId', sql.Int, loanId)
      .query('SELECT EquipmentId FROM Loans WHERE LoanId = @LoanId');

    if (loanResult.recordset.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Loan not found' },
      };
    }

    const equipmentId = loanResult.recordset[0].EquipmentId;

    // Update loan
    const result = await connection.request()
      .input('LoanId', sql.Int, loanId)
      .input('ReturnedAt', sql.DateTime, new Date())
      .input('ReturnFeedback', sql.NVarChar, body.ReturnFeedback || '')
      .query(`
        UPDATE Loans 
        SET ReturnedAt = @ReturnedAt, ReturnFeedback = @ReturnFeedback
        OUTPUT INSERTED.*
        WHERE LoanId = @LoanId
      `);

    // Update equipment availability
    await connection.request()
      .input('EquipmentId', sql.Int, equipmentId)
      .query('UPDATE Equipment SET IsAvailable = 1 WHERE EquipmentId = @EquipmentId');

    return {
      status: 200,
      jsonBody: result.recordset[0],
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error returning loan:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to return loan' },
    };
  }
}

// PATCH /api/loans/return-batch - Return multiple loans
async function returnBatchLoans(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as BatchReturnRequest;

    if (!Array.isArray(body.LoanIds) || body.LoanIds.length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'Array of LoanIds is required' },
      };
    }

    const connection = await getConnection();
    const returnedLoans = [];

    for (const loanId of body.LoanIds) {
      // Get the equipment ID before updating
      const loanResult = await connection.request()
        .input('LoanId', sql.Int, loanId)
        .query('SELECT EquipmentId FROM Loans WHERE LoanId = @LoanId');

      if (loanResult.recordset.length === 0) {
        continue;
      }

      const equipmentId = loanResult.recordset[0].EquipmentId;

      // Update loan
      const result = await connection.request()
        .input('LoanId', sql.Int, loanId)
        .input('ReturnedAt', sql.DateTime, new Date())
        .input('ReturnFeedback', sql.NVarChar, body.ReturnFeedback || '')
        .query(`
          UPDATE Loans 
          SET ReturnedAt = @ReturnedAt, ReturnFeedback = @ReturnFeedback
          OUTPUT INSERTED.*
          WHERE LoanId = @LoanId
        `);

      // Update equipment availability
      await connection.request()
        .input('EquipmentId', sql.Int, equipmentId)
        .query('UPDATE Equipment SET IsAvailable = 1 WHERE EquipmentId = @EquipmentId');

      returnedLoans.push(result.recordset[0]);
    }

    return {
      status: 200,
      jsonBody: returnedLoans,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error returning batch loans:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to return batch loans' },
    };
  }
}

// Register routes
app.http('getAllLoans', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'loans',
  handler: getAllLoans,
});

app.http('getLoanById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'loans/{id}',
  handler: getLoanById,
});

app.http('getActiveLoans', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'loans/active',
  handler: getActiveLoans,
});

app.http('getLoansByPerson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'loans/person/{personId}',
  handler: getLoansByPerson,
});

app.http('getActiveLoansByPerson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'loans/person/{personId}/active',
  handler: getActiveLoansByPerson,
});

app.http('createLoan', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'loans',
  handler: createLoan,
});

app.http('createBatchLoans', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'loans/batch',
  handler: createBatchLoans,
});

app.http('returnLoan', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'loans/{loanId}/return',
  handler: returnLoan,
});

app.http('returnBatchLoans', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'loans/return-batch',
  handler: returnBatchLoans,
});
