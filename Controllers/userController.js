import User from "../Model/model.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import File from "../Model/File.js";
import { json } from "express";
import Comment from "../Model/comment.js"
// import postLike from "../Model/postLike.js";
import postLike from "../Model/postLike.js";
import Follow from '../Model/Follow.js';
import { now } from "mongoose";

export const Signup = async(req,res)=>{
    try {
       
        const { email, fullname, password, username } = req.body;
        

        if (!email || !fullname || !password || !username) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10); // Use async version
        const hash = await bcrypt.hash(password, salt);
       

        await User.create({
            email,
            password: hash,
            fullname,
            username,
        });

        return res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        console.error("Error in signup:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
    
}

export const SignIn = async(req,res)=>{
    try{
        const {email, password} = req.body;
        
        
        if(!email||!password){
            return res.status(400).json({message: "All fileds are required"})
        }
        
        const existUser = await User.findOne({email})
      
        if(existUser){
           
        const isMatch = bcrypt.compareSync(password, existUser.password);
        if(isMatch){
           
            const token = jwt.sign({ email: existUser.email }, 'secret', { expiresIn: '1h' });
    
            // Set token in the cookie
            res.cookie('tokenData', token, {
                httpOnly: true,  // For security, prevents JS access to the cookie
                secure: false,   // Set to true in production if using HTTPS
                sameSite: 'None', // Important for cross-origin cookies
                expires: new Date(Date.now() + 3600000), // 1-hour expiry
            });
            return res.status(200).json({message:"user are successfully Login", email:email})
        }
        return res.status(200).json({message:"user are successfully Login", email:email})
        } 
    }catch(error){
        return res.status(500).json({message:"server error", error:error.message})
    }
}

export const Logout = (req,res)=>{
   
    // res.clearCookie('token')
    return res.status(200).json({msg: "Logout successfully"})
    
}

export const Posts = async(req,res)=>{
    console.log("welcome to userpost: ")
    const postData = await File.find();
    
    console.log("find userpost: ", postData)
      
       return res.status(200).json({data:postData})
} 
export const userPosts = async(req,res)=>{
    const email = req.params.userId;

     const postData = await User.findOne({email});
     
     res.status(200).json({postData})
}

export const likedata = async(req,res)=>{
    
       const likeData = await postLike.find();
   
       res.status(200).json({data:likeData})
} 

 export const profile = async(req,res)=>{
     const email = req.params.userId;
    
     const profileData = await User.findOne({email});

       res.status(200).json({data:profileData})
 }


export const LikePhoto = async (req, res) => {
    const { postId, userId } = req.params;
   

    try {
        // Find the post document using postId (assuming `File` is your Post model)
        const post = await File.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Find the existing postLike document for this postId
        let postLikeDoc = await postLike.findOne({ postId });
             
        if (!postLikeDoc) {
            postLikeDoc = new postLike({
                postId,
                userId,
                likeCount: 1, // Set initial like count to 1
                liked:true,
                likedUser: [userId] // Initialize likedUser array with the current user
            });

            await postLikeDoc.save(); // Save the new postLike document
            return res.status(200).json({
                message: "Post liked!",
                likeCount: postLikeDoc.likeCount, // Return likeCount from postLikeDoc
                liked:postLikeDoc.liked
            });
        }


        // Ensure likedUser is an array
        if (!Array.isArray(postLikeDoc.likedUser)) {
            postLikeDoc.likedUser = [];
        }

        // Check if the user has already liked the post
        if (!postLikeDoc.likedUser.includes(userId)) {
            // Add the user to likedUser array and increase likeCount
            postLikeDoc.likedUser.push(userId);
            postLikeDoc.likeCount += 1;
            postLikeDoc.liked = true,

            // Save the updated document (this time it's a Mongoose document instance)
            await postLikeDoc.save();
           

            // Return the updated likeCount
            return res.status(200).json({
                message: "Post liked!",
                likeCount: postLikeDoc.likeCount // Return updated likeCount
            });
        } else {
            return res.status(400).json({ message: "You have already liked this post." });
        }

    } catch (error) {
        console.error("Error liking the post:", error);
        return res.status(500).json({ message: "Something went wrong." });
    }
};


// Follow and unFollow User
export const Followuser = async(req,res)=>{
   const  {userId,PostId} = req.params;
    console.log("follow")
     const email = JSON.parse(userId)
     const postId = JSON.parse(PostId)
    try{
        const post = await User.findOne({email});

        if(!post){
            return res.status(404).json({ message: "Post not found" });
        }
       
        let FollowDoc = await Follow.findOne({postId})
        
        if(!FollowDoc){

            FollowDoc = new Follow({
                userId:email,
                postId:PostId,
                followUsers:[email],
                followCount:1,
                Followd:true,
            })

            await FollowDoc.save();
            return res.status(200).json({
                message: "Followed",
                followCount: FollowDoc.followCount, // Return likeCount from postLikeDoc
                Followd:FollowDoc.Followd
            });    
        }
        if (!Array.isArray(FollowDoc.followUsers)) {
            FollowDoc.followUsers = [];
        }

        if(!FollowDoc.followUsers.includes(email)){
            FollowDoc.followUsers.push(email);
            FollowDoc.followCount +=1;
            FollowDoc.Followd = true;

            await FollowDoc.save();
            return res.status(200).json({
                message: "Followed",
                likeCount: FollowDoc.followCount, // Return updated likeCount
                Followd:FollowDoc.Followd
            });
        }
    }
    catch(error){
           console.log(error)
    }
}

export const unFollowUser = async(req,res)=>{
    try{
        const{userId,unFollowUserId} = req.params;
        const UserId = JSON.parse(userId);
        
        const deleteData  = await Follow.deleteOne({userId:UserId});
        res.status(200).json({msg:"unfollow user successfully"})
    }catch(err){
        console.log(err)
    }
                   
}  

export const followedUsers = async (req, res) => {
    try {
        const { UserId } = req.params;
        
        const userId = JSON.parse(UserId); // no need to JSON.parse

        const response = await Follow.find({userId});

        return res.status(200).json({
            followedUser: response,
            followCount: response.length
          });
    } catch (error) {
        console.error("Error in followedUsers:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// all user
export const Users = async(req,res)=>{
       const users = await User.find();
    res.status(200).json({res: users})

}

export const postComment  = async(req,res)=>{
    const {userId,userpostId,comment} = req.body;
   try{
       let CommentData = await Comment.findOne({userPostId:userpostId})
        if(!CommentData){
           console.log("if")
          CommentData = new Comment({
                //   userId: [userId],
                  userPostId:userpostId,
                  comment:[{[userId]: comment}]
            })
            console.log("commetData: ",CommentData);
            await CommentData.save(); 
            
           }else{
               const FindUserId = Comment.findOne({userId})
               if(!FindUserId){
               CommentData.userId.push(userId);
            }
            CommentData.comment.push({[userId]:comment});
            
            await CommentData.save();
        }
        console.log(userpostId)
        const findComments =  await Comment.findOne({userPostId:userpostId})
        res.status(200).json({
            msg:"comment added successfully",
            comment:findComments
        })

   }catch(err){
    res.status(500).json({err:err})
   }
}

export const userComments = async(req,res)=>{
    try{
        const postId = req.params.postId;
        console.log(postId);
        const comment = await Comment.findOne({userPostId:postId});
        console.log(comment)
         res.status(200).json({
            msg:"comment added successfully",
            comment:comment
        })

    }catch(err){
        res.status(500).json({err:err})
    }

    
}