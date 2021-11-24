const mongoose=require('mongoose');

//creating a func for connection

const connectdatabase=async()=>{
const conn= await mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true

});
console.log(`Mongo connected:${conn.connection.host}`);
}

module.exports=connectdatabase;