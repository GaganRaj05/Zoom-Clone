const { JsonWebTokenError } = require("jsonwebtoken");
const Users = require("../models/user")
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
async function handleRegisteration(req, res) {
    try {
        const {name, email, password} = req.body;
        const user = await Users.findOne({email});
        if(user){
            return res.status(401).json("User already exists")
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        await Users.create({
            name,
            email,
            password:hashedPassword
        })
        return res.status(201).json("User created successfully");
    }
    catch(err) {
        console.log(err.message);
        return res.status(501).json("Some error occured while creating a user");
    }
}

async function handleLogin(req, res) {
    try {
        const {email, password} = req.body;
        const user = await Users.findOne({email})
        if(!user) {
            return res.status(401).json("Create an account");
        }
        const result = await bcrypt.compare(password, user.password)
        if(!result){
            return res.status(401).json("Incorrect password");
        }
        const token = await jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'1h'});

        res.cookie("jwt",token, {
            httpOnly:true,
            secure:false
        })
        return res.status(201).json("Login successfull")
    }
    catch(err) {
        return res.status(501).json("Internal server error");
    }
}

module.exports = {
    handleRegisteration,
    handleLogin
};