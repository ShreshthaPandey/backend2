import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
 

const generateAccessAndRefreshToken = async (userId)=>
    {
    try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return {accessToken , refreshToken}

    }catch{
        throw new apiError(500 , "something went wrong while generating refresh token")
    }
}


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

  const {fullName , email , username , password} = req.body
  console.log("email:", email);

if([fullName , email , username , password].some((field)=>
    field?.trim() === "")
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

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath) 


 if(!avatar){
      throw new apiError(400, "avatar is required")
 }

 const user = await  User.create({ // only user is talking to data base as made by mongoDb .... here we are storing data given by user
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || " ", // coverimg ho bhi skta hi aur nahi bhi beacaouse hmne useme check nhi lagaya hi hence put this condition
    email,
    password,
    username: username.toLowerCase()
 })

 const createUser = await User.findById(user._id).select(
    "-password -refreshToken"
 )

 if(!createUser){
     throw new apiError(500, "something went wrong while registering the user")
 }

 return res.status(201).json(
    new apiResponse(200 ,createUser, "user registered successfully" )
 )

})

const loginUser = asyncHandler(async(req , res) => {
    // req body -> data
    // username or email
    //find the user
    //passward check
    //access and refresh token
    // send cookie

    const {email , username, password} = req.body

    if(!username && !email){
        throw new apiError(400 , "username or email is required")

    }
    
    const user = await User.findOne({
        $or:[{username} , {email}]
    })

    if(!user){
        throw new apiError(400 , "user not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
         throw new apiError(401 , "invalid user credentials")

    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken" , accessToken , options).cookie("refreshToken", refreshToken, options).json(
        new apiResponse(
            200,
            {
user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req , res) =>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
            {
                new: true
            }
        
    )
        const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new apiResponse(200 ,{}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req , res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401 , "unauthorised request")

    }

try {
       const decodedToken = jwt.verify(
            incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiError(401 , "invalid refresh token")
    
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
          throw new apiError(401 , "invalid refresh token")
    
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
       return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken" , newRefreshToken , options ).json(
        new apiResponse(
            200,
            {
               accessToken,
               refreshToken: newRefreshToken
            },
            "access token refreshed"
            
        )
       )
    
    
    
} catch (error) {
    throw new apiError(401 , error?.message || "error occured")
}
})

const changeCurrentPassword = asyncHandler(async(req , res)=>{
    const {oldPassword , newPassword } = req.body
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new apiError(400, "password not match")

    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new apiResponse(200 , {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req , res)=>{
    return res.status(200).json(new apiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req , res)=>{
    const {fullName , email} = req.body

    if(!fullName || !email){
        throw new apiError(400 , "all fields required")
    }
     
    const user =   await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200).json(new apiResponse(200 , user , "account details updated successfully"))

})

const updateUserAvatar =  asyncHandler(async(req, res)=>{

   const avatarLocalPath =  req.file?.path

   if(!avatarLocalPath){
    throw new apiError(400 , "avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)


   if(!avatar.url){
     throw new apiError(400 , "error while uploading on avatar")
   }

  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    {new: true}
   ).select("-password")

      return res.status(200).json(new apiResponse(200 , user , "avatar updated successfully"))


})

const updateUserCoverImage =  asyncHandler(async(req, res)=>{

   const coverImageLocalPath =  req.file?.path

   if(!coverImageLocalPath){
    throw new apiError(400 , "cover img file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)


   if(!coverImage.url){
     throw new apiError(400 , "error while uploading on coverImg")
   }

  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage: coverImage.url
        }
    },
    {new: true}
   ).select("-password")

   return res.status(200).json(new apiResponse(200 , user , "coverImg updated successfully"))


})
export {
    registerUser,
     loginUser,
     logoutUser,
     refreshAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage
     
}
