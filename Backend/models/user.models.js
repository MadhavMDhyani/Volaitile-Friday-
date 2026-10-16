import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
 
const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minlength: [6, 'Email must be at least 6 characters long'],
        maxlength: [50, 'Email must be at most 50 characters long'],
    
    },

    password:{
        type:String,
        required:true,
        select:false,
    }

})

userSchema.statics.hashPassword = async function (password) { 
    return await bcrypt.hash(password, 10);
}

userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateJWT = function () {
    return jwt.sign(
        { _id: this._id, email: this.email },
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

const User = mongoose.models.User || mongoose.models.user || mongoose.model('user', userSchema);
if (!mongoose.models.User) {
    mongoose.model('User', userSchema);
}

export default User;

