import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        //Check if any field is empty
        if (!username || !password || !email) {
            return res.status(401).json({
                message: "Fill all the required fields",
                success: false,
            });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(401).json({
                message: "This email Id already exists",
                success: false,
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        //10 is salt value

        await User.create({
            username,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Account created successfully",
            success: true,
        });

    } catch (error) {
        console.log(error);
    }
};


export const login=async(req,res)=>{
    try {
        const {email,password}=req.body;

        if(!email||!password){
            res.status(401).json({
                message:"Fill all the fields",
                success:false
            });
        }

        let user=await User.findOne({email});
        if(!user){
            res.status(401).json({
                message:"User doesn't exist. Please create an account",
                success:false
            });
        }
        const isPasswordMatched= await bcrypt.compare(password,user.password);
        if(!isPasswordMatched){
            res.status(401).json({
                message:"Incorrect password",
                success:false
            });
        }

   user={
    _id:user._id,
    username:user.username,
    email:user.email,
    profilePicture:user.profilePicture,
    bio:user.bio,
    followers:user.followers,
    following:user.following,
    posts:user.posts,
       }

     const token= await jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:'1d'});

     return res.cookie('token',token,{
        httpOnly:true,
        sameSite:'strict',
        maxAge:1*24*60*60*1000
     }).json({
        message:`Welcome!!! back ${user.username}`,
        success:true,
        user
     });



    } catch (error) {
        console.log(error)
    }
};


export const logout=async(_,res)=>{
    try {
        return res.cookie("token","",{maxAge:0}).json({
            message:"Logged out successfully",
            success:true
        });
    } catch (error) {
        console.log(error)
    }
};


export const getProfile=async(req,res)=>{
    try {
        const userId=req.params.id;

        let user=await User.findById(userId).select('-password');
        return res.status(200).json({
            user,
            success:true
        });
    } catch (error) {
        console.log(error);
    }
};


export const editProfile=async(req,res)=>{
    try {
        const userId=req.id;
        const {bio,gender}=req.body;
        const profilePicture=req.file;
       let cloudResponse;
       if(profilePicture){
        const fileUri=getDataUri(profilePicture);
        cloudResponse=await cloudinary.uploader.upload(fileUri);
       }

       const user=await User.findById(userId).select('-password');
       if(!user){
        res.status(404).json({
            message:"User not found",
            success:false
        })
       };
       if(bio) user.bio=bio;
       if(gender) user.gender=gender;
       if(profilePicture) user.profilePicture=cloudResponse.secure_url;
       await user.save();
       return res.status(200).json({
        message:"Profile updated",
        success:true,
        user
       });

    } catch (error) {
        console.log(error);
    }
};


export const getSuggestedUsers=async(req,res)=>{
    try {
        const suggestedUsers=await User.find({_id:{$ne:req.id}}).select("-password");
        if(!suggestedUsers){
            return res.status(400).json({
                message:"Currently do not have any users",
                success:false
            });
        }
        return res.status(200).json({
            success:true,
            users:suggestedUsers
        });
    } catch (error) {
        console.log(error);
    }
};

export const followOrUnfollow=async(req,res)=>{
    try {
        const userRequestingFollow=req.id;
        const userRequestedToFollowed=req.params.id;
        if(userRequestingFollow===userRequestedToFollowed){
            return res.status(400).json({
                message:"You can't follow or unfollow yourself",
                success:false
            });
        }

        const user= await User.findById(userRequestingFollow);
        const target=await User.findById(userRequestedToFollowed);

        if(!user || !target){
            return res.status(400).json({
                message:"User not found",
                success:false
            });
        }

        const isFollowing=user.following.includes(userRequestedToFollowed);
        if(isFollowing){
            //unfollow logic
            await Promise.all([
                User.updateOne({_id:userRequestingFollow},{$pull:{following:userRequestedToFollowed}}),
                User.updateOne({_id:userRequestedToFollowed},{$pull:{followers:userRequestingFollow}})
            ])

            return res.status(200).json({
                message:"Unfollowed successfully",
                success:ftrue
            });
        }
        else{
            //follow logic

            await Promise.all([
                User.updateOne({_id:userRequestingFollow},{$push:{following:userRequestedToFollowed}}),
                User.updateOne({_id:userRequestedToFollowed},{$push:{followers:userRequestingFollow}})
            ])
            return res.status(200).json({
                message:"Followed successfully",
                success:true
            });
        }

    } catch (error) {
        console.log(error);
    }
};