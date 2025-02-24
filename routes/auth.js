const express = require('express');
const {handleRegisteration,handleLogin} = require("../controller/auth")
const router = express.Router();

router.post("/register",handleRegisteration)

router.post("/login",handleLogin);

module.exports = router;

