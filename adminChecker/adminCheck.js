const {profileCollection} = require('../databaseConnection/databaseConnection');
const adminCheck = async (req,res,next)=>{
         try{
            const filter = { email: req.body.adminEmail };
            console.log(filter);
            const  adminMakeEmail = await profileCollection.findOne(filter);
            console.log(adminMakeEmail);
            if(adminMakeEmail){
                next();
            }
         }
         catch{
             console.log('not admin');
             next();
         }
}
module.exports = adminCheck;