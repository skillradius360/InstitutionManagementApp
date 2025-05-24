import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { User } from "../models/users.models.js"
import { cloudUploader } from "../utils/cloudinary.js"
import { mongoose, isValidObjectId } from "mongoose"


const signUp = asyncHandler(async (req, res) => {
    const { fullName, password, email, phoneNumber, joiningDate, parentsNumber,stream,fees } = req.body
    const { userType } = req.params

    if ([fullName, password, email, phoneNumber, joiningDate,fees].some((data) => data?.trim() === "")) {
        throw new apiError(400, "credentails not recieved properly")
    }

    const existingUser = await User.findOne({
        $or: [{ fullName }, { email }]
    })
    if (existingUser) {
        throw new apiError(400, "User already exists")
    }

    const avatar = req.file?.path
    if (!avatar) {
        throw new apiError(400, "avatar not uploaded or found")
    }
console.log(avatar)
    const uploadedAvatarUrl = await cloudUploader(avatar)
    if (!uploadedAvatarUrl) {
        throw new apiError(400, "avatar not uploaded to cloud")
    }

    if (userType == "STUDENT") {

        if (!(parentsNumber && stream)){
    throw new apiError(400,"student creation data missing")
        }

        const userEntry = await User.create({
            fullName,
            password: password,
            userAvatar: uploadedAvatarUrl?.url,
            email: email,
            userType: "STUDENT",
            studentId: joiningDate.slice(0, 2) + fullName.slice(0, 3) +stream+ joiningDate.slice(joiningDate.length - 4, joiningDate.length),
            phoneNumber,
            parentsNumber,
            fees

        })
         if (!userEntry) {
        throw new apiError(400, "user registration failure")
    }
    return res.status(200).json(new apiResponse(200, userEntry, "User successfully signed In"))
    }
    else if (userType == "TEACHER") {
        const userEntry = await User.create({
             fullName,
            password: password,
            userAvatar: uploadedAvatarUrl?.url,
            email: email,
            userType: "TEACHER",
            teacherId: joiningDate.slice(0, 2) + fullName.slice(0, 3) + joiningDate.slice(joiningDate.length - 4, joiningDate.length),
            phoneNumber

        })
         if (!userEntry) {
        throw new apiError(400, "user registration failure")
    }
    return res.status(200).json(new apiResponse(200, userEntry, "User successfully signed In"))
    }

    else if(userType=="ADMIN"){
        const userEntry = await User.create({
             fullName,
            password: password,
            userAvatar: uploadedAvatarUrl?.url,
            email: email,
            userType: "ADMIN",
            studentId: joiningDate.slice(0, 2) + fullName.slice(0, 3) + joiningDate.slice(joiningDate.length - 4, joiningDate.length),
            phoneNumber,
           

        })
         if (!userEntry) {
        throw new apiError(400, "user registration failure")
    }
    return res.status(200).json(new apiResponse(200, userEntry, "User successfully signed In"))
    }

    if (!userEntry) {
        throw new apiError(400, "user registration failure")
    }
    return res.status(200).json(new apiResponse(200, userEntry, "User successfully signed In"))
})

async function accessTokenAndRefreshTokenGenerator(userid) {
    const userId = await User.findById(userid)
    const accessToken = userId.generateAccessToken()
    const refreshToken = userId.generateRefreshToken()


    userId.refreshToken = refreshToken
    await userId.save({ validateBeforeSave: false })

    //    console.log(accessToken,refreshToken)
    return { accessToken, refreshToken }
}



const login = asyncHandler(async (req, res) => {
    const { password, email } = req.body
    if ([password, email].some((data) => data.trim() === "")) {
        throw new apiError(400, "credentials not recieved successfully")
    }

    const userObj = await User.findOne({email:email})
    if (!userObj) {
        throw new apiError(400, "No entry found..Please SIGNUP")
    }

    const checkPassword = await userObj.checkPassword(password)
    if (!checkPassword) {
        throw new apiError(400, "password mismatch")
    }

    const { accessToken, refreshToken } = await accessTokenAndRefreshTokenGenerator(userObj._id)
    console.log(accessToken, refreshToken)
    if (!(accessToken || refreshToken)) {
        throw new apiError(400, "no access or refreshToken")
    }

    const Options = {
        httpOnly: true,
        secure: true
    }

    const loggedInUser = await User.findById(userObj._id).select("-password -accesstoken ")

    res.status(200).cookie("accessToken", accessToken, Options).cookie("refreshToken", refreshToken, Options)
        .json(new apiResponse(200, { loggedInUser, accessToken, refreshToken }))


})

const logOut = asyncHandler(async (req, res) => {
    const userObj = await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        }, {
        new: true
    }
    )
    if (!userObj) {
        throw new apiError(400, "user not found from cookies")
    }

    const Options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("accessToken", Options)
        .clearCookie("refreshToken", Options)
        .json(new apiResponse(200, [], "user logged out successfully"))
})

const refreshCookie = asyncHandler(async (req, res) => {
    // 
    const { refreshItem } = req.body

    if (!refreshItem) {
        throw new apiError(400, "NO refreshToken recieved from user ")
    }

    const isTokenValid = jwt.verify(refreshItem, process.env.REFRESH_TOKEN_SECRET)
    if (!isTokenValid) {
        throw new apiError(400, "Token not valid")
    }

    const user = User.findById(isTokenValid?._id)
    if (!(refreshItem === user.refreshToken)) {
        throw new apiError(400, "refresh token mismatch")
    }

    const Options = {
        httpOnly: true,
        secure: true
    }
    const { accessToken, refreshToken } = accessTokenAndRefreshTokenGenerator(user?._id)
    if (!accessToken && !refreshToken) {
        throw new apiError(400, "access or refreshToken not found while refreshing")
    }
    res.status(200)
        .cookie("accessToken", accessToken, Options)
        .cookie("refreshToken", refreshToken, Options)
        .json(new apiResponse(200, [], "tokens refreshed succecssfully"))
})

const deleteUser = asyncHandler(async (req, res) => {
    const user = req.user
    if (!user && isValidObjectId(req.user?._id)) {
        throw new apiError(400, "error found")
    }

    const deletedUser = await User.findByIdAndDelete(req.user._id)
    if (!deletedUser) {
        throw new apiError(400, "deleting...")
    }

    const doesUserExist = await user.findById(req.user._id)
    if (doesUserExist) {
        throw new apiError(400, "user deleted successfully")
    }
    res.status(200).json(new apiResponse(200, [], "deleted user success"))
})

const updateUserImages = asyncHandler(async (req, res) => {
    const avatar = req.file?.path
    if (!avatar) {
        throw new apiError(400, "No avatar files recieved to be uploaded")
    }

    const avatarCloudUploadURL = await cloudUploader(avatar)
    if (!avatarCloudUploadURL) {
        throw new apiError(400, "no avatar image recieved")
    }
    const coverCloudUploadURL = await cloudUploader(coverImage)
    if (!coverCloudUploadURL) {
        throw new apiError(400, "no cover image recieved")
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                userAvatar: avatarCloudUploadURL?.url,
                
            }
        }, {
        new: true
    }
    ).select("-__v -refreshToken")

    if (!updatedUser) {
        throw new apiError(400, "cover and avatar update failed")
    }


    res.status(200)
        .json(new apiResponse(200, updatedUser, "The users a re updated their profile successfully"))
})


const deleteUserById = asyncHandler(async (req, res) => {
    const userId = req.params

    if (!isValidObjectId(userId)) throw new apiError(400, "Enter a valid user Id")

    const isuserValid = await User.findById(userId)

    if (!isuserValid) throw new apiError(401, "user not found !")

    const deletedUser = await User.deleteUserById(isuserValid._id)

    if (!deletedUser) throw new apiError(400, "user deletion unsuccessfull")

    res.status(200).json(new apiResponse(200, deletedUser, "User deleted successfully"))


})
const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { username, fullName, email } = req.body

    if ([username, fullName, email].some((data) => data.trim === "")) {
        throw new apiError(400, "please enter username or fullname or Email correctly")
    }

    if (!isValidObjectId(userId)) {
        throw new apiError(400, "invalid Id or not logged in")
    }


    const userExists = await User.findByIdAndUpdate(userId,
        {
            $set: {
                username,
                password,
                email
            },

        },
        { new: true }
    )

    if (!userExists) {
        throw new apiError(400, "problem finding or updating the user !")
    }

    req.status(200).json(new apiResponse(200, userExists, "user updated successfully!"))
})


const makePayment = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    const data= req.body
    console.log(data)
    if(!userId) throw new apiError(401,"user not logged In!")
    
    const userCurrent = await User.findByIdAndUpdate(userId,{
        $push:{
            feePaymentStatus:
                data
            
        },
        
        new:true
        
    })
    return res.status(200).json(new apiResponse(200,userCurrent,"updated 🤑🤑"))
})
export {
    signUp, login, logOut, refreshCookie, deleteUser,
    updateUserImages, deleteUserById, updateUserProfile,makePayment
}