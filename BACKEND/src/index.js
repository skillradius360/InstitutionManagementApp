import { app } from "./app.js";
import { connectDB } from "./db/mongo.js";
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})

connectDB().then(()=>{

 try {
       app.listen(8000,()=>{
        app.on("error",(error)=>{console.error("express conenction failure",error)})
           console.log("Connected to express at port 8000 ✅")
       })
 } catch (error) {
    
 }
})