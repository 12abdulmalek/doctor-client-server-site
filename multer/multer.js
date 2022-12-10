const express = require("express");
const multer = require('multer')
const path = require("path");
  let imageName = "";
const storage = multer.diskStorage({
    destination:path.join("./image"),
          filename:(req,file,cb)=>{
            // console.log(file);
            imageName = Date.now() + path.extname(file.originalname);
            cb(null,imageName); 
          }
  })
  
  

  const upload = multer({ 
    storage: storage,
    fileFilter:function(req,file,cb){
      cb(null,true);
    }
  });
  module.exports = {upload,storage};