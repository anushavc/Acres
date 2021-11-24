const express=require('express');
const {register,login,getMe,forgotPassword,resetPassword,updateDetails,updatePassword,deleteUser,logout}=require('../controllers/auth');
const {protect}=require('../middleware/auth')
const router=express.Router();

router.post('/register',register);
router.post('/login',login);
router.route('/me').get(protect,getMe);
router.route('/updatedetails').put(protect,updateDetails);
router.route('/updatepassword').put(protect,updatePassword);
router.route('/forgotpassword').post(forgotPassword);
router.put('/resetpassword/:resettoken',resetPassword);
router.route('/deleteuser').delete(protect,deleteUser);
router.get('/logout',logout)

module.exports=router;