const Property=require('../models/property')
const ErrorResponse=require('../utils/errorResponse')
const asyncHandler=require('../middleware/async')
const geocoder=require('../utils/geocoder')
const path=require('path');

//Get all the properties listed
//GET api/properties
//public
exports.getProperties=asyncHandler(async(req,res,next)=>{
    let query;

    let queryStr=JSON.stringify(req.query);
    queryStr=queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,match=>`$${match}`);
    query=Property.find(JSON.parse(queryStr));

    //select fields
    if(req.query.select){
        const fields=req.query.select.split(',').join(' ');
        query=query.select(fields);
    }
    //sorting based on price
    if(req.query.sort){
        const sortBy=req.query.sort.split(',').join(' ');
        query=query.sort(sortBy);
    }
    else{
        query= query.sort('-createdAt');
    }
    const properties=await query;
    res.status(200).json({success:true,count:properties.length,data:properties});
});

//Get a single property
//GET api/properties/:id
//public
exports.getProperty=asyncHandler(async(req,res,next)=>{
        const property=await Property.findById(req.params.id);
        if(!property){
            return next(new ErrorResponse(`The property is not found with the id of ${req.params.id}`,404));
        }
        res.status(200).json({success:true,data:property});
});

//Create a new property
//POST api/properties
//private
exports.createProperty=asyncHandler(async(req,res,next)=>{
    req.body.user=req.user.id;
    const publishedProperty=await Property.findOne({user:req.user.id})
    const property=await Property.create(req.body);
    res.status(201).json({success:true,data:property});
});

//Update property
//PUT api/properties/:id
//Private
exports.updateProperty=asyncHandler(async(req,res,next)=>{

        let property=await Property.findById(req.params.id);
        if(!property){
            return res.status(400).json({success:false});
        }
        if(property.user.toString()!=req.user.id)
        {
            return next(
                new ErrorResponse(`User ${req.params.id} is not authorized to update this property`,401)
            )
        }
        property=await Property.findOneAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        res.status(200).json({success:true,data:property});

});

//Delete property
//DELETE api/properties/:id
//public
exports.deleteProperty=asyncHandler(async(req,res,next)=>{
    let property=await Property.findById(req.params.id);
    if(!property){
        return res.status(400).json({success:false});
    }
    if(property.user.toString()!=req.user.id)
    {
        return next(
            new ErrorResponse(`User ${req.params.id} is not authorized to delete this property`,401)
        )
    }
    property.remove();
    res.status(200).json({success:true,data:property});
     
});


//Get properties within a specific raduis
//DELETE api/properties/:id
//public
exports.getPropertiesInRaduis=asyncHandler(async(req,res,next)=>{
    const {zipcode,distance}=req.params;

    const loc=await geocoder.geocode(zipcode);
    const lat=loc[0].latitude;
    const lng=loc[0].longitude;

    const raduis=distance/3963;
    const properties=await Property.find({
        location:{
            $geoWithin:{
                $centerSphere:[[lng,lat],raduis]
            }
        }
    })

    res.status(200).json({
        success:true,
        count:properties.length,
        data:properties
    })
 
});

//Uploading photos of properties
//PUT api/properties/:id/photo
//private
exports.uploadPhoto=asyncHandler(async(req,res,next)=>{
    const property=await Property.findById(req.params.id);
    if(!property){
        return next(new ErrorResponse(`The property is not found with the id of ${req.params.id}`,404));
    }

    if(property.user.toString()!=req.user.id)
    {
        return next(
            new ErrorResponse(`User ${req.params.id} is not authorized to update this property photo`,401)
        )
    }

    if(!req.files){
        return next(new ErrorResponse(`Upload the image please`,400));
    }
    //checking if the file is an image or not
    const file=req.files.file;
    if(!file.mimetype.startsWith('image'))
    {
        return next(new ErrorResponse(`Please upload a file`,400));
    }

     // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

    //creating a custom file name
    file.name=`photo_${property._id}${path.parse(file.name).ext}`;
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
          console.error(err);
          return next(new ErrorResponse(`There is a problem with file upload`, 500));
        }
    
        await Property.findByIdAndUpdate(req.params.id, { photo: file.name });
    
        res.status(200).json({
          success: true,
          data: file.name
        });
      });
});
