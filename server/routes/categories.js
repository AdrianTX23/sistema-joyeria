const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
      if (err) {
        console.error('Database error getting categories:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ categories });
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
      if (err) {
        console.error('Database error getting category:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ category });
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new category
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const db = getDatabase();
    
    db.run(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description],
      function(err) {
        if (err) {
          console.error('Database error creating category:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Category name already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        db.get('SELECT * FROM categories WHERE id = ?', [this.lastID], (err, newCategory) => {
          if (err) {
            console.error('Database error getting new category:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ 
            message: 'Category created successfully',
            category: newCategory 
          });
        });
      }
    );
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id],
      function(err) {
        if (err) {
          console.error('Database error updating category:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Category name already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }

        db.get('SELECT * FROM categories WHERE id = ?', [id], (err, updatedCategory) => {
          if (err) {
            console.error('Database error getting updated category:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ 
            message: 'Category updated successfully',
            category: updatedCategory 
          });
        });
      }
    );
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if category has products
    db.get('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id], (err, result) => {
      if (err) {
        console.error('Database error checking category products:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category that has products. Please reassign or delete the products first.' 
        });
      }

      db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Database error deleting category:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantity) as total_stock,
        SUM(p.price * p.stock_quantity) as total_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `;

    db.all(query, (err, categories) => {
      if (err) {
        console.error('Database error getting category stats:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const totalCategories = categories.length;
      const totalProducts = categories.reduce((sum, cat) => sum + cat.product_count, 0);
      const totalValue = categories.reduce((sum, cat) => sum + parseFloat(cat.total_value || 0), 0);

      res.json({
        summary: {
          totalCategories,
          totalProducts,
          totalValue: totalValue.toFixed(2)
        },
        categories: categories.map(cat => ({
          ...cat,
          totalValue: parseFloat(cat.total_value || 0).toFixed(2)
        }))
      });
    });
  } catch (error) {
    console.error('Category stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
