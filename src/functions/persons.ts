import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query } from '../lib/database';

interface Person {
  PersonId: number;
  Name: string;
  Surname: string;
  Email: string;
  Gsm: string;
  Telefoon: string;
  Adres: string;
  Postnr: string;
  Gemeente: string;
  Brevet: string;
  SpecBrev: string;
  LidSinds: Date;
  ActiefLid: number;
  SaldoDuiken: number;
  SaldoZuurstof: number;
  CreatedAt: Date;
  UpdatedAt: Date;
}

// GET /api/persons - Get all persons
async function getAllPersons(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const persons = await query<Person>('SELECT * FROM Persons ORDER BY Surname, Name');
    return {
      status: 200,
      jsonBody: persons,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching persons:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch persons' },
    };
  }
}

// GET /api/persons/active - Get active persons
async function getActivePersons(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const persons = await query<Person>(
      'SELECT * FROM Persons WHERE ActiefLid = 1 ORDER BY Surname, Name'
    );
    return {
      status: 200,
      jsonBody: persons,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching active persons:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch active persons' },
    };
  }
}

// GET /api/persons/{id} - Get person by ID
async function getPersonById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      return {
        status: 400,
        jsonBody: { error: 'Person ID is required' },
      };
    }

    const persons = await query<Person>(
      'SELECT * FROM Persons WHERE PersonId = @id',
      { id }
    );

    if (persons.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Person not found' },
      };
    }

    return {
      status: 200,
      jsonBody: persons[0],
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching person:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch person' },
    };
  }
}

// Register routes
app.http('getAllPersons', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'persons',
  handler: getAllPersons,
});

app.http('getActivePersons', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'persons/active',
  handler: getActivePersons,
});

app.http('getPersonById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'persons/{id}',
  handler: getPersonById,
});
