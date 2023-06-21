import asyncHandler from "express-async-handler";
import User from "../model/User.js";
import Token from "../model/Token.js"
import Wallet from "../model/Wallet.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from 'crypto'
import sendEMail from "../utils/sendEmail.js";
import sendSMS from "../utils/sendSMS.js";
import sendEmail from "../utils/termilEmailSend.js";
import sendOTP from "../utils/sendTermiiSMS.js";
import verifyOTP from "../utils/verifyTermiiOTP.js";


const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
}


//>>>> Register User
// http://localhost:6001/api/user/register
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body
 
    //User input validation
    if ( !username || !email || !password ) {
     res.status(400).json({message: "Please fill in all required fields"})
     throw new Error({message: "Please fill in all required fields"})
    } 

    //checking for password lenght
    if (password.length < 6) {
     res.status(400).json({message: "Password must be upto 6 characters"})
     throw new Error({message: "Password must be upto 6 characters"})
     
    }

    //check if user email already exist
    //username
    const usernameExists = await User.findOne({username: username} || {email: email})
    
    if (usernameExists) {
     res.status(400).json({message: "Username has already been registered by another user"})
     throw new Error({message: "Username has already been registered by another user"})
    }

    //email
    const emailExists = await User.findOne({email: email})
    
    if (emailExists) {
    return res.status(200).json({message: "Email has already been registered, please login"})
    }
 
    //Create new user
    const user = await User.create({
    fullname: '',
     username,
     password,
     email,
     phone: null,
     bankName: '',
     bankAccountNumber: '',
     accountHolderName: '',
     location: '',
     community: '',
     religion: '',
     gender: '',
     accountType: 'User',
     isEmailVerified: false,
     isPhoneVerified: false,
     taskCompleted: 0,
     taskOngoing: 0,
     adsCreated: 0,
     freeTaskCount: 3
    });

    if (!user) {
      res.status(400).json({message: "Failed to register User"})
     throw new Error({message: "Failed to register User"})
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
     throw new Error({message: "Failed to Create Wallet for Registered User, Please contact admin"})
    }

  if (user && wallet) {
    const {_id, username, email, isEmailVerified } = user
      const userData = {
        _id, username, email, isEmailVerified 
      }

    res.status(200).json(userData);
  }

  if (!user && !wallet) {
    res.status(500).json('Registeration failed');
    throw new Error("Registeration failed")
  }
 });


//>>>> Login User
// http://localhost:6001/api/user/login
export const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body
 
    //validate login request
    if (!email || !password) {
     res.status(400).json({message: "Please add details to login"})
     throw new Error({message: "Please add details to login"})
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

    //Check if user email is verified
    if (user.isEmailVerified === false) {
      const {username, email, isEmailVerified } = user
      const userData = {
        username, email, isEmailVerified 
      }
     res.status(200).json(userData)
     return
    }

  let loginToken
    if (user.isEmailVerified === true) {
 
     //Generate token
   loginToken = generateToken(user._id)
 
   //send HTTP-Only cookie 
   res.cookie("token", loginToken, {
     path: "/",
     httpOnly: true,
     expires: new Date(Date.now() + 1000 * 86400), // 1 day
     sameSite: "none",
     secure: true
   })
  }
 
    if (user && passwordIsCorrect && loginToken) {
      const walletId = await Wallet.find({userId: user._id})
     const {_id, fullname, username, email, phone, location, community, religion, gender, accountType, bankName,
bankAccountNumber, accountHolderName, isEmailVerified, isPhoneVerified, taskCompleted, taskOngoing, adsCreated, freeTaskCount } = user
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
          bankName,
          bankAccountNumber,
          accountHolderName,
         isEmailVerified, 
         isPhoneVerified,
        taskCompleted,
        taskOngoing,
        adsCreated,
        freeTaskCount,
        walletId,
         loginToken
     })
    } else {
     res.status(400).json({message: "Invalid User or Password"})
     throw new Error({message: "Invalid User or Password"})
    }
 
 })

 //>>>> GET User 
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
        const {_id, fullname, username, email, phone, location, community, religion, gender, accountType, bankName,bankAccountNumber, accountHolderName, isEmailVerified, isPhoneVerified, taskCompleted, taskOngoing, adsCreated, freeTaskCount} = user
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
          bankName,
          bankAccountNumber,
          accountHolderName,
          isEmailVerified, 
          isPhoneVerified,
          taskCompleted,
          taskOngoing,
          adsCreated,
          freeTaskCount,
      })
      }
   } catch (error) {
       res.status(500).json({error: error.message});
   }
}

//>>>>  GET ALL USERS 
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
          accountType: 1,
          bankName: 1,
          bankAccountNumber: 1,
          accountHolderName: 1,
          isEmailVerified: 1, 
          isPhoneVerified: 1,
          taskCompleted: 1,
          taskOngoing: 1,
          adsCreated: 1,
          freeTaskCount: 1,
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

//>>>>  LOGOUT USERS 
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


//>>>> Get Login Status
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


//>>>> Update User details
export const updateUser = asyncHandler(async (req, res) => {
  const { userId, fullname, location, community, gender, religion  } = req.body

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
    const {fullname, username, email, phone, location, community, religion, gender, accountType, bankName,
      bankAccountNumber,
      accountHolderName, isEmailVerified, 
      isPhoneVerified,
      taskCompleted,
      taskOngoing,
      adsCreated,
      freeTaskCount } = updatedUserDetails
    res.status(200).json({
        fullname, 
        username, 
        email, 
        phone, 
        location, 
        community, 
        religion, 
        gender,
        accountType,
        bankName,
        bankAccountNumber,
        accountHolderName,
        isEmailVerified, 
        isPhoneVerified,
        taskCompleted,
        taskOngoing,
        adsCreated,
        freeTaskCount

    })
   } else {
    res.status(400).json({message: "Invalid Updated User Details"})
   }
})


export const updateUserAccountDetails = asyncHandler( async(req, res) => {

  const {userId, username, email, phone} = req.body
  //check if username and email already exist
    //username

    const user = await User.findById(userId)


    //Check if user is authorized to make this update
    if (user.isPhoneVerified === false) {
      res.status(401).json({message: "You are not allowed to make this change, complete phone number verification"})
      throw new Error({message: "You are not allowed to make this change, complete phone number verification"})
    }

    if (user.isPhoneVerified === true) {

      // Check if new email has already being registered by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({email})

        if (existingUser) {
          return res.status(400).json({message: 'Email already taken'})
        }
      }

      // Check if new username has already being registered by another user
      if (username && username !== user.username) {
        const existingUser = await User.findOne({username})

        if (existingUser) {
          return res.status(400).json({message: 'Username already taken'})
        }
      }

      // Check if new phone number has already being registered by another user
      if (phone && phone !== user.phone) {
        const existingUser = await User.findOne({phone})

        if (existingUser) {
          return res.status(400).json({message: 'Phone number is already in use'})
        }
      }
      
        //Update User Account Details
          const updatedUser = await User.findByIdAndUpdate(
          {_id: userId},
          {
            email: email || req.user.email,
            username: username || req.user.username,
            phone: phone || req.user.phone,
          }
          )

          if (!updatedUser) {
            res.status(500);
            throw new Error({message: "Failed to updated user account details"})
          }

          if (updateUser) {
            const { _id, fullname, username, email, phone, location, community, gender, accountType, isEmailVerified, isPhoneVerified } = updatedUser
  
            res.status(200).json({ _id, fullname, username, email, phone, location, community, gender, accountType, isEmailVerified, isPhoneVerified }) 
          }
    }
})


//>>>> Change user password
export const verifyPasswordChange = asyncHandler(async (req, res) => {
    const { userId, password } = req.body

    const user = await User.findById(userId)

    // Check if user exist
     if(!user) {
        res.status(400).json("User not found, please register");
        throw new Error("User not found, please register");
     }

    //validate password
     if (!password) {
         res.status(400).json("Please add old");
         throw new Error("Please add old");
     }

    // check if old password matches password in the db
    const passwordIsCorrect = await bcrypt.compare(password, user.password)

     if (user && passwordIsCorrect) {
        res.status(200).json({message: "Password is Correct"})
     } else {
        res.status(400).json({message: "Password is Incorrect"})
        throw new Error("Old password is Incorrect");
     }
})

//>>>> Change user password
export const changePassword = asyncHandler(async (req, res) => {
  const { userId, newPassword, oldPassword } = req.body

  const user = await User.findById(userId)

  //Check if user exist
  if(!user) {
      res.status(400).json("User not found, please register");
      throw new Error("User not found, please register");
  }

  //validate password
  if(!newPassword || !oldPassword) {
      res.status(400).json("unauthorized change");
      throw new Error("unauthorized change");
  }

  // check if old password matches password in the db
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

  //save new password
  if (user && passwordIsCorrect) {
      user.password = newPassword
      await user.save()
      res.status(200).json("Password changed successfully")
  } else {
      res.status(400)
      throw new Error("Old password is incorrect");
  }
})


//>>>> Reset Password
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


//>>>> Send and resend Verification Email
export const verifyEmail = asyncHandler(async(req, res) => {
  const {email} = req.params
  
  const user = await User.findOne({email})

  if (!user) {
    res.status(404).json("No user found");
    throw new Error("No user found")
  }

  if (user) {
    //Delete token if it exists in the DB
    let token = await Token.findOne({userId: user._id})

    if (token) {
      await token.deleteOne()
    }

  // generate new verification token
  let verificationToken = crypto.randomBytes(32).toString("hex") + user._id

  //Hask token before saving to DB
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex')

  //Save Token to DB
  const saveTokenToDB = await new Token({
    userId: user._id,
    token: "",
    emailVerificationToken: hashedToken,
    phoneVerificationOTP: "",
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000) // Thirty minutes
  }).save()

 

  if (!saveTokenToDB) {
    res.status(500);
    throw new Error("Internal server Error")
  }

  if (saveTokenToDB) {
    
    // Contruct frontendURL
    const frontendUrl = process.env.FRONTEND_URL

    const verificationLink = `${frontendUrl}/verified?token=${verificationToken}`;

    //Send Verification Email
    const message = `
    <h2>Hello, ${user.username}</h2>
    <p>Please use the verification url to verify your belocated account.</p>
    <p>The reset link is valid for 30minutes</p>

    <a href=${verificationLink} clicktracking=off>${verificationLink}</a>

    <p>Regards...</p>
    <p>Belocated Team</p>
    `
    const subject = 'Email Verification'
    const send_to = user.email
    const reply_to = "noreply@noreply.com"

    

    //Finally sending email
    const emailSent = await sendEMail(subject, message, send_to, reply_to)

    if (!emailSent) {
      res.status(500).json('Email verification failed');
      throw new Error('Email verification failed')
    }

    if (emailSent) {
      res.status(200).json('Verification Email Sent Successfully');
    }
  }
  }
})


 //>>>> Email Account Verification
 export const verifyUser = asyncHandler(async (req, res) => {
  const {token} = req.params;

  //Hask token, then compare with token in db
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  //find token in db
  const userToken = await Token.findOne({
    emailVerificationToken: hashedToken,
    expiresAt: {$gt: Date.now()}
  })

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token, request for another token");
  }

  // find user
  const updatedUserDetails = await User.findByIdAndUpdate(
    { _id: userToken.userId },
    {
      isEmailVerified: true,
    },
    {
        new: true,
        runValidators: true
    }
)

if (!updatedUserDetails) {
  res.status(500);
  throw new Error("Failed to verify user");
}

if (updatedUserDetails) {
 // const updatedUser = await User.findById(userToken.userId)

    const {_id, isEmailVerified } = updatedUserDetails
  
  res.status(200).json({ _id, isEmailVerified })
  }
}
)


 //>>> Phone Verification
 export const verifyUserPhone = asyncHandler( async(req, res) => {
  const {userId, username, email, phone} = req.body

  const user = await User.findById(req.user._id)
  const token = await Token.findOne({userId: req.user._id})

  if (!user && !token) {
    res.status(400);
      throw new Error({message: "Authorization error"})
  }

 const response =  await sendOTP(phone)
  
  if (!response) {
    res.status(500);
      throw new Error({message: "Sending OTP failed"})
  }

  if (response) {
    if (response.status === 200) {

    //Save phone OTP
    const token = await Token.findOne({userId: req.user._id})

    if (!token) {
      res.status(500);
      throw new Error({message: "Sending OTP failed"})
    }

    token.phoneVerificationOTP = response.pinId,
    token.createdAt = Date.now(),
    token.expiresAt = Date.now() + 30 * (60 * 1000) // Thirty minutes

    //save the update on task model
    const updatedToken = await token.save(); 

    if (!updatedToken) {
      res.status(500);
          throw new Error("failed to send OTP")
    }
    
    if (updatedToken) {
      res.status(200).json("OTP sent successfully")
    }
    }
    
  }
 })


  //>>> Verify Phone
  export const confirmUserPhone = asyncHandler(async (req, res) => {
    const {OTP} = req.params;

    //Reset Phone verification status to false
    // find user ancd change phone verification status to false
    const resetUserPhoneVerifiedStatus = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        isPhoneVerified: false,
      },
      {
          new: true,
          runValidators: true
      }
  )

      if (!resetUserPhoneVerifiedStatus) {
        res.status(500);
        throw new Error({message: "Server failed to complete verification process"})
      }
  
    //find user token
    const token = await Token.findOne({userId: req.user._id})

    if (!token) {
      res.status(500);
      throw new Error({message: "Verification failed"})
    }

    

    const response = await verifyOTP(token.phoneVerificationOTP, OTP)

    if (!response) {
      res.status(500);
        throw new Error({message: "OTP verification failed"})
    }
  
    if (response && response.verified === true) {

      //toggle user to verified
      const user = await User.findById(req.user._id)

      user.isPhoneVerified = true

      //save toggle user to verified
      const verifiedUser = await user.save(); 

      if (!verifiedUser) {
        res.status(500).json("Failed to verify user by phone");
        throw new Error({message: "Failed to verify user by phone"});
      }
    
      if (verifiedUser) {
      const {  _id, 
        fullname, 
        username, 
        email, 
        phone, 
        location, 
        community, 
        religion, 
        gender,
        accountType,
        bankName,
        bankAccountNumber,
        accountHolderName,
        isEmailVerified, 
        isPhoneVerified,
      taskCompleted,
      taskOngoing,
      adsCreated,
      freeTaskCount,
      walletId } = verifiedUser
        
      res.status(200).json({  _id, 
        fullname, 
        username, 
        email, 
        phone, 
        location, 
        community, 
        religion, 
        gender,
        accountType,
        bankName,
        bankAccountNumber,
        accountHolderName,
        isEmailVerified, 
        isPhoneVerified,
      taskCompleted,
      taskOngoing,
      adsCreated,
      freeTaskCount,
      walletId,
  })

      }

  }
})


//>>> Delete User
export const deleteUser = asyncHandler(async(req, res) => {
  const {userId} = req.params

  if (req.user.accountType !== "Admin") {
    res.status(401);
    throw new Error({message: "User not authorized to perform this action"})
  }

  const user = await User.findById({_id: userId })
  
  if(!user) {
      res.status(400).json("User does not exist or already deleted")
  } 

  const delUser = await User.findByIdAndDelete(userId)

  if (!delUser) {
    res.status(500);
    throw new Error({message: "Error Deleting User"})
  }

  res.status(200).json("User Deleted successfully")
})


