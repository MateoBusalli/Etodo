const mariadb = require("mariadb");
const { connect } = require("../routes/todos/todos");
const pool = mariadb.createPool({
host: "localehost:8000",
user:"",
password: "",
database: "",
connectionLimit: 5
});


module.exports = pool;