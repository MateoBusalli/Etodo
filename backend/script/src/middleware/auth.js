// import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET;
//Recuperer le token
const auth_middleware = (req, _res, next) => {

    try{
         const token = req.headers.authorization?.split(' ')[1];
    // const token = req.headers['authorization'];
    // jwt.verify(token, JWT_SECRET, (_err, decoded) => {
    //     req.user = decoded;
    //     next();
    // });


if (!token) {
    return res.status(401).json({message: 'Token not find'});
}
//Vérifier et decoder le token
const deconded = jwt.verify(token,JWT_SECRET)

//Ajouter les infos des utilisateurs
req.user = deconded; {id,name,firstname,password,email,user_id,list_id,list_name,title,description,status,position,created_at,
  updated_at,due_time}

//Naviguer de route en routes
next()
    }catch(err){
        return res.status(401).json({message: 'Token invalid'});
    }
};
// export default auth_middleware;
module.exports = auth_middleware
