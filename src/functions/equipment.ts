import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query } from '../lib/database';

interface Equipment {
  EquipmentId: number;
  Name: string;
  Brand: string;
  Size: string;
  ItemNumber: string;
  CategoryName: string;
  LastInspection: Date;
  NextInspection: Date;
  IsAvailable: number;
}

// GET /api/equipment - Get all equipment
async function getAllEquipment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const equipment = await query<Equipment>('SELECT * FROM Equipment ORDER BY CategoryName, Name');
    return {
      status: 200,
      jsonBody: equipment,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching equipment:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch equipment' },
    };
  }
}

// GET /api/equipment/available - Get available equipment
async function getAvailableEquipment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const equipment = await query<Equipment>(
      'SELECT * FROM Equipment WHERE IsAvailable = 1 ORDER BY CategoryName, Name'
    );
    return {
      status: 200,
      jsonBody: equipment,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching available equipment:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch available equipment' },
    };
  }
}

// GET /api/equipment/category/{categoryName} - Get equipment by category
async function getEquipmentByCategory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const categoryName = request.params.categoryName;
    if (!categoryName) {
      return {
        status: 400,
        jsonBody: { error: 'Category name is required' },
      };
    }

    const equipment = await query<Equipment>(
      'SELECT * FROM Equipment WHERE CategoryName = @categoryName ORDER BY Name',
      { categoryName }
    );

    return {
      status: 200,
      jsonBody: equipment,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching equipment by category:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch equipment by category' },
    };
  }
}

// GET /api/equipment/{id} - Get equipment by ID
async function getEquipmentById(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    if (!id) {
      return {
        status: 400,
        jsonBody: { error: 'Equipment ID is required' },
      };
    }

    const equipment = await query<Equipment>(
      'SELECT * FROM Equipment WHERE EquipmentId = @id',
      { id }
    );

    if (equipment.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Equipment not found' },
      };
    }

    return {
      status: 200,
      jsonBody: equipment[0],
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching equipment:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch equipment' },
    };
  }
}

// Register routes
app.http('getAllEquipment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'equipment',
  handler: getAllEquipment,
});

app.http('getAvailableEquipment', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'equipment/available',
  handler: getAvailableEquipment,
});

app.http('getEquipmentByCategory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'equipment/category/{categoryName}',
  handler: getEquipmentByCategory,
});

app.http('getEquipmentById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'equipment/{id}',
  handler: getEquipmentById,
});
