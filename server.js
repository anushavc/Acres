const express=require('express');
const dotenv=require('dotenv');
const morgan=require('morgan');
const cookieParser=require('cookie-parser');
const connectdatabase=require('./config/db');
const errorHandler=require('./middleware/error');
const fileupload=require('express-fileupload');
const cors=require('cors');

const path=require('path')

//Load env vars
dotenv.config({path:'./config/config.env'});

//router files
const properties=require('./routes/properties');
const auth=require('./routes/auth')

//connecting to database
connectdatabase();

const app=express();

app.use(express.json());
app.use(cookieParser());

//logging middleware
if(process.env.NODE_ENV=='development')
{
    app.use(morgan('dev'));
}
const corsOptions ={
    origin:'http://localhost', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

app.use(fileupload());
app.use(express.static(path.join(__dirname,'public')));
//mount the routers
app.use('/api/properties',properties);
app.use('/api/auth',auth);
app.use(errorHandler);


const PORT=process.env.PORT;
app.listen(PORT,console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
