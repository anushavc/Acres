const User=require('../models/User')
const ErrorResponse=require('../utils/errorResponse')
const asyncHandler=require('../middleware/async')
const sendEmail=require('../utils/sendEmail')
const geocoder=require('../utils/geocoder')
const path=require('path');
const crypto=require('crypto');
//register a user
//POST /api/auth/register

exports.register=asyncHandler(async(req,res,next)=>{
    const{name,email,password}=req.body;

    //create the actual user
    const user=await User.create({
        name,
        email,
        password
    })


    //token creation
    const token=user.getSignedJwtToken();
    res.status(200).json({success:true,token});
})  

//user login
//POST /api/auth/login

exports.login=asyncHandler(async(req,res,next)=>{
    const{email,password}=req.body;

   //validating the email or password
   if(!email||!password)
   {
       return next(new ErrorResponse('Please provide email and password',400))
   }
   const user=await User.findOne({email}).select('+password');

   //validating user

   if(!user)
   {
       return next(new ErrorResponse('Please provide valid user',401))
   }
   //checking if the password matches
   const isMatch=await user.matchPassword(password);
   if(!isMatch){
    return next(new ErrorResponse('valid password not entered',401))
   }
   sendTokenResponse(user,200,res);
})  

//logout/clear cookie
exports.logout= asyncHandler(async (req, res, next) => {
    res.cookie('token','none',{
        expires:new Date(Date.now()+10*1000),
        httpOnly:true
    });
    res.status(200).json({
        success: true,
        data:{}
    });
}); 






exports.getMe = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        data:req.user
    });
}); 

//get token from model,create cookie and send response
const sendTokenResponse=(user,statusCode,res)=>{
    //create token 
    const token=user.getSignedJwtToken();
    const options={
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly:true
    };

    if(process.env.NODE_ENV==='production'){
        options.secure=true;
    }
res.status(statusCode).cookie('token',token,options).json({
    success:true,token
});

}

//forgot password
//POST /api/auth/forgotpassword
exports.forgotPassword= asyncHandler(async (req, res, next) => {
    const user=await User.findOne({email:req.body.email});
    if(!user){
        return next(new ErrorResponse('There is no user with the particular email',404));
    }
    //get the reset token
    const resetToken=user.getResetPasswordToken();
    await user.save({validateBeforeSave:false});

    //create a reset url
    const resetUrl=`${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    const message=`You rececived this mail because you requested password reset. Please make a PUT request to:\n\n ${resetUrl}`;

    try{
        await sendEmail({
            email:user.email,
            subject:'Password reset token',
            message

        });
        res.status(200).json({success:true,data:'Email sent'});
    }
catch(err){
console.log(err);
user.resetPasswordToken=undefined;
user.resetPasswordExpire=undefined;
await user.save({
    validateBeforeSave:false
});
return next(new ErrorResponse('Email could not be sent',500));
};

    console.log(resetToken);
    res.status(200).json({
        success: true,
        data:req.user
    });
}); 

//resetpassword
exports.resetPassword= asyncHandler(async (req, res, next) => {
    const resetPasswordToken=crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user=await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()}
    });
    if(!user){
        return next(new ErrorResponse('Invalid token',400));
    }
    user.password=req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save();
    sendTokenResponse(user,200,res);
}); 


exports.updateDetails=asyncHandler(async(req,res,next)=>{
    const fieldsToUpdate={
        name:req.body.name,
        email:req.body.email
    }
    const user=await User.findByIdAndUpdate(req.user.id,fieldsToUpdate,{
        new:true,
        runValidators:true
    })
    res.status(200).json({
        success:true,
        data:user
    })
})

//update the password
//put request /updatepassword
exports.updatePassword= asyncHandler(async (req, res, next) => {
    const user=await User.findById(req.user.id).select('+password');

    //check current password
    if(!(await user.matchPassword(req.body.currentPassword))){
        return next(new ErrorResponse('Password is incorrect',401));
    }
    user.password=req.body.newPassword;
    await user.save();

    sendTokenResponse(user,200,res);
}); 

//Delete user
exports.deleteUser=asyncHandler(async(req,res,next)=>{
    const user=await User.findByIdAndUpdate(req.user.id);
    user.remove();
    res.status(200).json({
        success:true,
        data:user
    })
     
});