import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
export const app = express()
app.use(cookieParser())
app.use(express.json({
    limit:"20kb"
}))

app.use(express.urlencoded({
    extended:true
}))
app.use(cors({
    origin:["http://localhost:8000",
        "http://localhost:5000"
    ],credentials:true
}))

import { userRouter } from "./routes/users.routes.js"

app.use("/users",userRouter)
// app.use("/videos",videoRouter)

