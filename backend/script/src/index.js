const express = require('express');
const app = express();
const port = 8000


console.log(require("./routes/todos/todos")); // doit afficher [Function: router]


//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false}));

//Routes
app.use("/todos",require("./routes/todos/todos"));


//Middleware pour les routes non trouvées
app.use((req, res, next) => {
res.status(404).json({error: "Route non trouve au port: "+ req.params.id})
});

//Lancer le serveur
app.listen(port, () => console.log("le serveur a démarré au port " + port));