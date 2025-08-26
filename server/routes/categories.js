const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();

// Get all categories
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    
    db.all('SELECT * FROM categories ORDER BY name', (err, categories) => {
      db.close();
      if (err) {
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
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
      db.close();
      if (err) {
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
router.post('/', (req, res) => {
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
          db.close();
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Category name already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        db.get(
          'SELECT * FROM categories WHERE id = ?',
          [this.lastID],
          (err, newCategory) => {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ 
              message: 'Category created successfully',
              category: newCategory 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', (req, res) => {
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
          db.close();
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Category name already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          db.close();
          return res.status(404).json({ error: 'Category not found' });
        }

        db.get(
          'SELECT * FROM categories WHERE id = ?',
          [id],
          (err, updatedCategory) => {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
              message: 'Category updated successfully',
              category: updatedCategory 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if category is being used by any products
    db.get(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id],
      (err, result) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        if (result.count > 0) {
          db.close();
          return res.status(400).json({ 
            error: 'Cannot delete category that has associated products' 
          });
        }

        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
          db.close();
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
          }
          res.json({ message: 'Category deleted successfully' });
        });
      }
    );
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
