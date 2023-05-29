import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
}


//Register User
// http://localhost:6001/api/user/register
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body
 
    //User input validation
    if ( !username || !email || !password ) {
     res.status(400).json({message: "Please fill in all required fields"})
     throw new Error("Please fill in all required fields")
    } 

    //checking for password lenght
    if (password.length < 6) {
     res.status(400).json({message: "Password must be upto 6 characters"})
     throw new Error("Password must be upto 6 characters")
     
    }
    //check if user email already exist
    //username
    const usernameExists = await User.findOne({username: username} || {email: email})
    
    if (usernameExists) {
     res.status(400).json({message: "Username has already been registered by another user"})
     throw new Error("Username has already been registered by another user")
    }

    //email
    const emailExists = await User.findOne({email: email})
    
    if (emailExists) {
     res.status(400).json({message: "Email has already been registered, please login"})
     throw new Error("Email has already been registered, please login")
    }
 
    //Create new user
    const user = await User.create({
    fullname: '',
     username,
     password,
     email,
     phone: null,
     location: '',
     community: '',
     religion: '',
     gender: '',
     accountType: 'User'
    });

    if (!user) {
      res.status(400).json({message: "Failed to register User"})
     throw new Error("Failed to register User, please try again")
    }

    let wallet;

    if (user) {
      //Create new wallet for User
        wallet = await Wallet.create({
        userId: user._id,
        value: 0,
        totalEarning: 0,
        pendingBalance: 0,
        amountSpent: 0
        });
    }

    if (!wallet) {
      res.status(400).json({message: "Failed to Create Wallet for Registered User, Please contact admin"})
     throw new Error("Failed to Create Wallet for Registered User, Please contact admin")
    }
      
 
   //Generate token
   const token = generateToken(user._id)
 
   //send HTTP-Only cookie 
   res.cookie("token", token, {
     path: "/",
     httpOnly: true,
     expires: new Date(Date.now() + 1000 * 86400), // 1 day
     sameSite: "none",
     secure: true
   })

   if (!token) {
    res.status(400).json({message: "No token generated"})
   throw new Error("No token generated")
  }


 
   //return details of the created user
    if (user && wallet && token) {
     const {_id, username, email, accountType } = user
     const walletId = wallet._id
     res.status(201).json({
         _id, username, email, walletId, accountType, token
     })
    } else {
     res.status(400).json({message: "Invalid user data"})
    }
 });


//Login User
// http://localhost:6001/api/user/login
export const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body
 
    //validate login request
    if (!email || !password) {
     res.status(400).json({message: "Please add details to login"})
     throw new Error("Please add details to login")
    }
 
    //Check if user exist
    const user = await User.findOne({email})
 
    //if user doesnt exist
    if (!user) {
     res.status(400).json({message: "User not found, please Register"})
     throw new Error("User not found, please Register")
    }
 
    //when user exist - check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password)

    if (!passwordIsCorrect) {
      res.status(400).json({message: "Incorrect Password"})
      throw new Error("Incorrect Password")
    }
 
     //Generate token
   const token = generateToken(user._id)
 
   //send HTTP-Only cookie 
   res.cookie("token", token, {
     path: "/",
     httpOnly: true,
     expires: new Date(Date.now() + 1000 * 86400), // 1 day
     sameSite: "none",
     secure: true
   })
 
    if (user && passwordIsCorrect) {
     const {_id, fullname, username, email, phone, location, community, religion, gender, accountType } = user
     res.status(200).json({
         _id, 
         fullname, 
         username, 
         email, 
         phone, 
         location, 
         community, 
         religion, 
         gender,
         accountType,
         token
     })
    } else {
     res.status(400).json({message: "Invalid User or Password"})
    }
 
 })

 /*  GET User */
// http://localhost:6001/api/user/:id 
export const  getUser = async(req, res) => {
  //const { userId } = req.body
  const { _id } = req.user
  try {
        const user = await User.findById({_id: _id })
       if(!user) {
           res.status(400).json({ msg: "Cannot find user" })
            throw new Error("Cannot find user")
       } 
       
       if (user) {
        const {_id, fullname, username, email, phone, location, community, religion, gender, accountType } = user
        res.status(200).json({
          _id, 
          fullname, 
          username, 
          email, 
          phone, 
          location, 
          community, 
          religion, 
          gender,
          accountType
      })
      }
   } catch (error) {
       res.status(500).json({error: error.message});
   }
}

/*  GET ALL USERS */
// http://localhost:6001/api/user/all
export const  getUsers = asyncHandler(async(req, res) => {

  if (req.user.accountType !== "Admin") {
    res.status(403)
    throw new Error("User not authorized")
  }

  if (req.user.accountType === "Admin") {

    const users = await User.find(
      {}, 
      {
          _id: 1,
          fullname: 1, 
          lastname: 1, 
          username: 1,
          email: 1,
          phone: 1,
          location: 1, 
          community: 1, 
          religion: 1, 
          gender: 1,
          accountType: 1
      })

  if (!users) {
      res.status(400)
      throw new Error("No User found in the database")
  }

if (users) {
    res.status(200).json(users)
   }

}
})

/*  LOGOUT USERS */
// http://localhost:6001/api/user/logout
export const logoutUser = asyncHandler(async(req, res) => {
    res.cookie("token", "", {
      path: "/",
      httpOnly: true,
      expires: new Date(0),
      sameSite: "none",
      secure: true
    })
  return res.status(200).json({message: "Successfully Logged Out"})
})


// Get Login Status
export const loginStatus = asyncHandler(async(req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false)
  }

  //Verify token
  const  verified = jwt.verify(token, process.env.JWT_SECRET)
  if (verified) {
    return res.json(true)
  } else {
    return res.json(false)
  }
})


//Update User details
export const updateUser = asyncHandler(async (req, res) => {
  const { userId, username, email, fullname, phone, location, community, gender, religion  } = req.body

  // if (userId !== req.user.id) {
  //   res.status.(400).json({message: "There's a problem with the validation for this user"})
  // }

  const user = await User.findById(req.user.id)

  //When request is not found
  if (!user ) {
      res.status(404).json("User not found in DB");
  }


  const updatedUserDetails = await User.findByIdAndUpdate(
      { _id: req.user.id },
      {
        fullname: fullname || req.user.fullname,
        username: username || req.user.username,
        email: email || req.user.email,
        phone: phone || req.user.phone,
        location: location || req.user.location,
        location: location || req.user.location,
        community: community || req.user.community,
        gender: gender || req.user.gender,
        religion: religion || req.user.religion,
      },
      {
          new: true,
          runValidators: true
      }
  )

  if (!updatedUserDetails) {
      res.status(404).json("Failed to update user details");
      throw new Error("Failed to update user details")
  }

  if (updatedUserDetails) {
    const {fullname, username, email, phone, location, community, religion, gender, accountType } = updatedUserDetails
    res.status(200).json({
        fullname, 
        username, 
        email, 
        phone, 
        location, 
        community, 
        religion, 
        gender,
        accountType

    })
   } else {
    res.status(400).json({message: "Invalid Updated User Details"})
   }
})


//Change user password
const changePassword = asyncHandler(async (res, req) => {
    const user = await User.findById(req.user._id)
    const { oldPassword, password } = req.body

    //Check if user exist
    if(!user) {
        res.status(400)
        throw new Error("User not found, please register");
    }

    //validate password
    if(!oldPassword || !password) {
        res.status(400)
        throw new Error("Please add old and new password");
    }

    // check if old password matches password in the db
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    //save new password
    if (user && passwordIsCorrect) {
        user.password = password
        await user.save()
        res.status(200).send("Password changed successfully")
    } else {
        res.status(400)
        throw new Error("Old password is incorrect");
    }
})


//Reset Password
export const forgotPassword = asyncHandler(async(req, res) => {
  const { email } = req.body

  const user = await User.findOne({email})

  if (!user) {
      res.status.apply(404)
      throw new Error("User does not exist")
  }

  //Create reset token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id

  //Hash token before saving to db
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  //Save token to DB

  await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000) // 30 minutes
  }).save()


  // contruct Reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

  //Reset Email
  const message = `
  <h2>Hello ${user.username} </h2>
  <p>Please use the url below to reset your password</p>
  <p>This reset link is valid for only 30minutes</p>

  <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

  <p>Regards</p>
  <p>Belocated Team</p>

  `;

  const subject = "Password Reset Request"
  const send_to = user.email
  const sent_from = process.env.EMAIL_USER

  try {
      await sendEmail(subject, message, send_to, sent_from)
      res.status(200).json(
          {
              success: true, 
              message: "reset email sent"
          })
  } catch (error) {
      res.status(500)
      throw new Error("Reset email not sent, please try again or contact admin")
  }
})


//Email Account Verification