import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

export async function connectDB(){
    try {
       let connectionData = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`)
       if(!connectionData) throw new error("database connection failure")
        console.log("\nCONNECTED TO MONGODB", connectionData.connection.host,"✅")
    return connectionData
    } catch (error) {
        console.error("DB connection failure")
    }
}