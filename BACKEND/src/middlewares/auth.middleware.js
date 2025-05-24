import { User } from "../models/users.models.js";
import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken"

const checkJWT= async function(req,res,next){
        const accessToken= req.cookies?.accessToken

try {
        if(!accessToken){
            throw new apiError(400,"please log in first to get cookies")
        }
    
        const accessTokenOk = await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
            if(!accessTokenOk){
                throw new apiError(400,"access token not valid")
            }
    
             const user= await User.findById(accessTokenOk._id)   
             if(!user){
                throw new apiError(400,"No user found while checking cookies")
             }
             req.user = user
             next()
} catch (error) {
    console.log("not logged in")
    next()
}

}

export {checkJWT}