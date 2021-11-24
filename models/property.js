const mongoose=require('mongoose');
const slugify=require('slugify')
const geocoder=require('../utils/geocoder')

const PropertySchema=new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add the name of property'],
        unique: true,
        trim: true,
        maxlength: [300, 'The property name cannot exceed 300 characters']
     },
     slug: String,
     longdescription: {
        type: String,
        required: [true, 'Please add a description for the property'],
        maxlength: [1000, 'Description can not be more than 1000 characters']
     },
     phone: {
        type: String,
        maxlength: [20, 'Phone number can not be longer than 20 characters']
     },
     email: {
        type: String,
        match: [
           /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
           'Please add a valid email'
        ]
     },
     address: {
        type: String,
        required: [true, 'Please add an address']
     },
     location: {
        // GeoJSON Point
        type: {
           type: String,
           enum: ['Point']
        },
        coordinates: {
           type: [Number],
           index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
     },
     tags: {
        // Array of strings
        type: [String],
        required: true,
        enum: [
           '3bhk',
           '2bhk',
           'luxury',
           'affordable',
           'family',
           'Good neighbourhood'
        ]
     },
     propertytype: {
        // Array of strings
        type: [String],
        required: true,
        enum: [
           'Apartment',
           'House',
           'Duplet',
           'Farmhouse',
           'Studio Apartment',
           ,'Penthouse',
           'Other'
        ]
     },
     averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must can not be more than 5']
     },
     price: Number,
     noOfBathrooms: Number,
     totalArea:Number,
     balcony:{
        type: Boolean,
        default: false
     },
     noOfRooms: {
        type: Number,
        min: [1, 'Atleast one room'],
        max: [10, 'Max no of rooms is 10']
     },
     photo: {
        type: String,
        default: 'no-photo.jpg'
     },
     buy:{
        type: Boolean,
        default: false
     },
     rent:{
        type: Boolean,
        default: false
     },
     createdAt: {
        type: Date,
        default: Date.now
     },
     user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
     }
})

//create property slub from the name
PropertySchema.pre('save',function(){
this.slug=slugify(this.name,{lower:true})
});

//geocode
PropertySchema.pre('save',async function(){
   const loc=await geocoder.geocode(this.address);
   this.location={
      type:'Point',
      coordinates:[loc[0].longitude,loc[0].latitude],
      formattedAddress:loc[0].formattedAddress,
      street:loc[0].streetName,
      city:loc[0].city,
      state:loc[0].stateCode,
      zipcode:loc[0].zipcode,
      country:loc[0].countryCode
   }
   });
   
module.exports=mongoose.model('Property',PropertySchema);