import Router from "express"
import { signUp,
    login,
    logOut,
    updateUserImages,makePayment} from "../controllers/users.controllers.js"
import {upload} from "../middlewares/multer.middleware.js"
import { checkJWT } from "../middlewares/auth.middleware.js"
const userRouter = Router()

userRouter.route("/signUp/:userType").post(upload.single("avatar"),signUp)


userRouter.route("/login").post(login)
userRouter.route("/logOut").get(checkJWT,logOut)
userRouter.route("/updateImg").get(checkJWT,upload.fields([
    {name:"avatar", maxCount:1},{name:"backgroundImage", maxCount:1}
]),updateUserImages)
userRouter.route("/editPaymentData").post(checkJWT,makePayment)
export {userRouter}  