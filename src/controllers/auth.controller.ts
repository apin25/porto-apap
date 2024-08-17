import { Request, Response } from "express";
import * as Yup from "yup";
import { sendVerificationEmail } from "../utils/mail/send-verif-email";
import jwt from "jsonwebtoken";

import { UserModel } from "../models/user.model";
import { decrypt } from "../utils/encryption";
import { SECRET } from "../utils/env";
import { IReqUser } from "../utils/interfaces";

const validateRegisterSchema = Yup.object().shape({
  name: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().required(),
  passwordConfirmation: Yup.string().oneOf(
    [Yup.ref("password"), ""],
    "Passwords must match"
  ),
});

const validateLoginSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().required(),
});

const validateProfileSchema = Yup.object().shape({
  name: Yup.string().required(),
  password: Yup.string().required(),
  passwordConfirmation: Yup.string().oneOf(
    [Yup.ref("password"), ""],
    "Passwords must match"
  ),
  profilePicture: Yup.string(),
});

export default {
  async profile(req: Request, res: Response) {
    const userId = (req as IReqUser).user.id;
    try {
      await validateProfileSchema.validate(req.body);

      await UserModel.updateOne({ _id: userId }, { ...req.body });

      const updatedProfile = await UserModel.findById(userId);

      res.status(200).json({
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).send({
          message: "Validation failed",
          error: error.errors,
        });
      }

      const _err = error as Error;

      res.status(500).json({
        message: "Error updating profile",
        data: _err.message,
      });
    }
  },
  async me(req: Request, res: Response) {
    const userId = (req as IReqUser).user.id;
    try {
      const user = await UserModel.findById(userId);
      res.status(200).json({
        message: "User details",
        data: user,
      });
    } catch (error) {
      const _err = error as Error;

      res.status(500).json({
        message: "Error getting user details",
        data: _err.message,
      });
    }
  },
  async login(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    await validateLoginSchema.validate({
      email,
      password,
    });

    const userByEmail = await UserModel.findOne({ email });

    if (!userByEmail) {
      throw new Error("User not found");
    }

    if (!userByEmail.isVerify) {
      return res.status(403).json({
        message: "Your account is not verified. Please check your email.",
      });
    }

    const decryptPassword = decrypt(SECRET, userByEmail.password);

    if (password !== decryptPassword) {
      throw new Error("Email and Password do not match");
    }

    const token = jwt.sign(
      { id: userByEmail._id, roles: userByEmail.roles },
      SECRET,
      {
        expiresIn: "6h",
      }
    );

    res.json({
      message: "User logged in successfully",
      data: token,
    });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return res.status(400).send({
        message: "Validation failed",
        error: error.errors,
      });
    }

    const _err = error as Error;

    res.status(500).json({
      message: "Error logging in user",
      data: _err.message,
    });
  }
},
async register(req: Request, res: Response) {
  const { name, username, email, password, roles = ["user"] } = req.body;
  try {
    await validateRegisterSchema.validate({
      name,
      username,
      email,
      password,
    });

    const user = await UserModel.create({
      name,
      username,
      email,
      password,
      roles,
    });
    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });

    const verifyUrl = `${req.protocol}://${req.get("host")}/api/verify-email?token=${token}`;

    await sendVerificationEmail(user.email, user.name, verifyUrl);

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      data: user,
    });
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return res.status(400).send({
        message: "Validation failed",
        error: error.errors,
      });
    }

    const _err = error as Error;

    res.status(500).json({
      message: "Error registering user",
      data: _err.message,
    });
  }
}
};
