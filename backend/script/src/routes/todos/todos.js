
const pool = require("../../config/db");
const express = require("express");
const router = express.Router();
const auth_middleware = require("../../middleware/auth");



//ROUTES FOR LISTS

// GET all lists for the connected user
router.get("/lists", auth_middleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    // Retrieve only the lists of the connected user
    const [lists] = await conn.query(
      `SELECT * FROM lists WHERE user_id = ? ORDER BY created_at ASC`,
      [req.user.id]
    );
    
    // For each list, retrieve its todos
    for (let list of lists) {
      const [todos] = await conn.query(
        `SELECT * FROM todo WHERE list_id = ? ORDER BY position ASC`,
        [list.id]
      );
      list.subtasks = todos; // Add todos to the list
    }
    
    conn.release();
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST create a new list
router.post("/lists", auth_middleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    
    const conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO lists (user_id, title, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [req.user.id, title, description || '']
    );
    conn.release();
    
    res.status(201).json({ 
      id: result.insertId, 
      title, 
      description,
      user_id: req.user.id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update an existing list
router.put("/lists/:id", auth_middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    
    const conn = await pool.getConnection();
    
    // Check that the list belongs to the user
    const [lists] = await conn.query(
      "SELECT * FROM lists WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    
    if (lists.length === 0) {
      conn.release();
      return res.status(404).json({ message: "List not found" });
    }
    
    await conn.query(
      "UPDATE lists SET title = ?, description = ?, updated_at = NOW() WHERE id = ?",
      [title, description || '', id]
    );
    conn.release();
    
    res.json({ message: "List updated", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a list
router.delete("/lists/:id", auth_middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    // Check that the list belongs to the user
    const [lists] = await conn.query(
      "SELECT * FROM lists WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    
    if (lists.length === 0) {
      conn.release();
      return res.status(404).json({ message: "List not found" });
    }
    
    // First delete all todos from this list
    await conn.query("DELETE FROM todo WHERE list_id = ?", [id]);
    
    // Then delete the list
    await conn.query("DELETE FROM lists WHERE id = ?", [id]);
    conn.release();
    
    res.json({ message: "List deleted", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ROUTES FOR TODOS 


// POST create a new todo
router.post("/todos", auth_middleware, async (req, res) => {
  try {
    const { list_id, title, description, status } = req.body;
    
    if (!list_id || !title) {
      return res.status(400).json({ message: "list_id and title are required" });
    }
    
    const conn = await pool.getConnection();
    
    // Check that the list belongs to the user
    const [lists] = await conn.query(
      "SELECT * FROM lists WHERE id = ? AND user_id = ?",
      [list_id, req.user.id]
    );
    
    if (lists.length === 0) {
      conn.release();
      return res.status(404).json({ message: "List not found" });
    }
    
    // Get the next position
    const [positions] = await conn.query(
      "SELECT MAX(position) as maxPos FROM todo WHERE list_id = ?",
      [list_id]
    );
    const nextPosition = (positions[0].maxPos || 0) + 1;
    
    const [result] = await conn.query(
      "INSERT INTO todo (user_id, list_id, title, description, status, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
      [req.user.id, list_id, title, description || '', status || false, nextPosition]
    );
    conn.release();
    
    res.status(201).json({ 
      id: result.insertId, 
      list_id,
      title, 
      description,
      status: status || false,
      position: nextPosition
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update an existing todo
router.put("/todos/:id", auth_middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    
    const conn = await pool.getConnection();
    
    // Check that the todo belongs to the user
    const [todos] = await conn.query(
      "SELECT * FROM todo WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    
    if (todos.length === 0) {
      conn.release();
      return res.status(404).json({ message: "Todo not found" });
    }
    
    await conn.query(
      "UPDATE todo SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?",
      [title, description || '', status || false, id]
    );
    conn.release();
    
    res.json({ message: "Todo updated", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a todo
router.delete("/todos/:id", auth_middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    // Check that the todo belongs to the user
    const [todos] = await conn.query(
      "SELECT * FROM todo WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    
    if (todos.length === 0) {
      conn.release();
      return res.status(404).json({ message: "Todo not found" });
    }
    
    await conn.query("DELETE FROM todo WHERE id = ?", [id]);
    conn.release();
    
    res.json({ message: "Todo deleted", id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;