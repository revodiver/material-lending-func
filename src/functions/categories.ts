import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query } from '../lib/database';

interface Category {
  CategoryId: number;
  CategoryName: string;
}

// GET /api/categories - Get all categories
async function getAllCategories(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const categories = await query<Category>('SELECT * FROM Categories ORDER BY CategoryName');
    return {
      status: 200,
      jsonBody: categories,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching categories:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch categories' },
    };
  }
}

// Register route
app.http('getAllCategories', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: getAllCategories,
});
