const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const randomize = require('randomatic');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'add a name'],
  },
  email: {
    type: String,
    required: [true, 'add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'add a password'],
    minlength: 8,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


//encrypting the passwords
UserSchema.pre('save',async function(next){
  if(!this.isModified('password')){
return next();
  }
  const gensalt=await bcrypt.genSalt(10);
  this.password=await bcrypt.hash(this.password,gensalt);
})

//signing the json web token 
UserSchema.methods.getSignedJwtToken=function(){
  return jwt.sign({id:this._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRE});
}

//matching the user password to hashed password in db
UserSchema.methods.matchPassword=async function(enteredPassword){
  return await bcrypt.compare(
    enteredPassword,this.password
  )
}

//generate and hash password token
UserSchema.methods.getResetPasswordToken=function(){
  //generate the token
  const resetToken=crypto.randomBytes(20).toString('hex');
  //hash token and set to resetPasswordToken Field
  this.resetPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex');
  //setting expire field
  this.resetPasswordExpire=Date.now()+10*60*1000;
  return resetToken;
}
module.exports = mongoose.model('User', UserSchema);