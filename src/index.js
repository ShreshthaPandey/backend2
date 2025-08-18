// require('dotenv').config({path:'./env'})
 // it could be a option but not looking good with import 

import dotenv from "dotenv"


import mongoose from "mongoose"
import {DB_NAME} from './constants.js'
import connectDb from './db/index.js'; 
import { app } from "./app.js";   

dotenv.config({
    path: './env'
})
// console.log("PORT:", process.env.PORT);

connectDb()

.then(()=>{
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`server is runnign at port : ${process.env.PORT}`);
    })
}
)
.catch((err) =>{
    console.log("MONGODB connection fail!!", err);
})


//import connectDb  from "./db"


// make or connect in another file and import here ...method 2









 // 1- first approach***********************************

// import express from "express"
// (async () =>{
// try{
//    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//    app.on("error", (error)=>{
//     console.log("ERRR:", error)
//     throw error
//    })
//    app.listen(process.env.PORT, ()=>{
//     console.log(`app is listening on port ${process.env.PORT}`)
//    })

// }catch(error){
//     console.log("ERROR:",error)
//     throw error
// }
// })