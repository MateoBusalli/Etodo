
const pool = require("../../config/db");
const express = require("express");
const router = express.Router();


//GET
router.get("/", async(req,res) => {

});

//POST 
router.post("/", (req,res) => {
console.log(req.body); 
res.json({message: "Todos ajouté", data: req.body});
});


//PUT(met a jours les changements)
router.put('/:id',(req,res) => {
res.json({message:"Todos modifié", id: req.params.id}); 
});

//DELETE
router.delete("/:id",(req,res) => {
     res.json({message: "Todos supprimé", id: req.params.id});
})
module.exports = router;