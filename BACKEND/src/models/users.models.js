import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },

    userAvatar: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    userType: {
        type: String,
        enum: ["TEACHER", "STUDENT", "ADMIN"],
        required: true
    },

    password: {
        type: String,
        required: true
    },

    studentId: {
        type: String,
        default: () => uuidv4()
    },

    teacherId: {
        type: String
    },

    joinDate: {
        type: Date
    },

    phoneNumber: {
        type: String
    },

    parentsNumber: {
        type: String
    },

    stream: {
        type: String
    },

    fees: {
        type: Number,
        default: 0
    },

    feePaymentStatus: 
       [ {
            paymentDate: { type: Date },
            paymentStatus: { type: Boolean, default: false },
            paymentAmount: { type: Number }
        }]
    }
);



userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 8)
    next()
})

userSchema.methods.checkPassword = async function (password) {
    if (!password) {
        throw new Error("no password recieved")
    }
    const isPasswordCorrect = await bcrypt.compare(password, this.password)
    return isPasswordCorrect
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username
    }, process.env.ACCESS_TOKEN_SECRET
        , { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    }, process.env.REFRESH_TOKEN_SECRET
        , { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}



export const User = mongoose.model("users", userSchema)