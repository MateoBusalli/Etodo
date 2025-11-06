
const pool = require("../../config/db");
const express = require("express");
const router = express.Router();


//GET
router.get("/", async(req,res) => {
try{
    const conn = await pool.getConnection();
    const rows = await conn.query(`SELECT * FROM todo
         JOIN users ON todo.user_id = users.id 
         JOIN lists on todo.list_id  = lists.id
         `);
    conn.release();
    res.json(rows);

}catch(err){
    res.status(500).json({error: err.message});
    
}
});

//POST 
router.post("/", async(req,res) => {
try {
    const { id,name,firstname,password,email,user_id,list_id,list_name,title,description,status,position,created_at,
  updated_at,due_time} = req.body; // Récupère les données envoyées
    const conn = await pool.getConnection();
    await conn.query("INSERT INTO users (name,firstname, password, email, created_at) VALUES (?, ?, ?, ?, ?)",
    [name,firstname, password, email, created_at]);

    await conn.query("INSERT INTO lists (user_id, title,description,created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  [user_id,title,description, created_at, updated_at]);


    const result = await conn.query(
      "INSERT INTO todo (user_id,list_id,title,description,status,position,created_at,updated_at,due_time) VALUES (?,?,?,?,?,?,?,?,?)",
      [user_id,list_id,title,description,status,position,created_at,updated_at,due_time]
    );
    conn.release();
    res.json({ message: "Todo ajouté", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//PUT(met a jours les changements)
router.put("/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const {title,description,status,position,created_at,updated_at,due_time } = req.body;
    const conn = await pool.getConnection();
    await conn.query("UPDATE users SET name =?,firstname = ?, password = ?, email = ?, created_at = ?",
        [name,firstname, password, email, created_at])
    await conn.query("UPDATE lists SET user_id = ?, title = ?,description = ?,created_at = ?, updated_at = ?",
        [user_id, title,description,created_at, updated_at])
    const result = await conn.query(
      "UPDATE todo SET title = ?,description = ?,status = ?,position = ?,created_at = ?,updated_at = ?,due_time = ? WHERE id = ?",
      [title,description,status,position,created_at,updated_at,due_time,id]
    );
    conn.release();
    res.json({ message: "Todo modifié", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




//DELETE
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    await conn.query("DELETE FROM lists WHERE user_id = ?",[id]);
    await conn.query("DELETE FROM todo WHERE user_id = ?",[id]);
    await conn.query("DELETE FROM users WHERE id = ?",[id]);
    conn.release();
    res.json({ message: "utilisateur supprimé"});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;