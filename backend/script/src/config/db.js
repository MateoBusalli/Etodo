const mariadb = require("mariadb");
const { connect } = require("../routes/todos/todos");
const pool = mariadb.createPool({
host: "localehost:8000",
user:"",
password: "",
database: "",
});


module.exports = pool;