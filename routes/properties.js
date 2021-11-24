const express=require('express');
const { protect }=require('../middleware/auth')
const {getProperties,getProperty,createProperty,updateProperty,deleteProperty,getPropertiesInRaduis,uploadPhoto}=require('../controllers/properties');
const router=express.Router();

router.route('/').get(getProperties).post(protect,createProperty);
router.route('/:id').get(getProperty).put(protect,updateProperty).delete(protect,deleteProperty);
router.route('/raduis/:zipcode/:distance').get(getPropertiesInRaduis);
router.route('/:id/photo').put(protect,uploadPhoto);

module.exports=router;