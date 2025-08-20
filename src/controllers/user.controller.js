import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploudOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req , res)=>{
  // get user details from fruntend
  // validation
  // check if user already exist: username , email
  //check for images, check for avatar
  //upload them to cloudinary
  // create user object - create entry in db
  // remove passward and refresh token field from response
  //check for user creation
  // return respnse   

  const {fullname , email , username , passward} = req.body
  console.log("email:", email);

if([fullname , email , username , passward].some((field)=>
    field?.trim() === " ")
){
    throw new apiError(400, "all fields are required")
}

const existedUser =  await User.findOne({
    $or: [{ username } , { email }]
})

if(existedUser){
     throw new apiError(400, "User with this username already exist")
}


const avatarLocalPath = req.files?.avatar[0]?.path;
//const coverImageLocalPath = req.files?.coverImage[0]?.path;


let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
}
if(!avatarLocalPath){
     throw new apiError(400, "avatar is required")
}

 const avatar = await uploudOnCloudinary(avatarLocalPath)
 const coverImage = await uploudOnCloudinary(coverImageLocalPath) 

 if(!avatar){
      throw new apiError(400, "avatar is required")
 }

 const user = await  User.create({ // only user is talking to data base as made by mongoDb .... here we are storing data given by user
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ", // coverimg ho bhi skta hi aur nahi bhi beacaouse hmne useme check nhi lagaya hi hence put this condition
    email,
    passward,
    username: username.toLowerCase()
 })

 const createUser = await User.findById(user._id).select(
    "-passward -refreshToken"
 )

 if(!createUser){
     throw new apiError(500, "something went wrong while registering the user")
 }

 return res.status(201).json(
    new apiResponse(200 ,createUser, "user registered successfully" )
 )

})

export {registerUser}
