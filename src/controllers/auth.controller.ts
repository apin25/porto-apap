import { Request, Response } from "express";
import * as Yup from "yup";
import { sendVerificationEmail } from "../utils/mail/send-verif-email";
import jwt from "jsonwebtoken";
import { UserModel, CustomerModel, SellerModel } from "../models/user.model";
import { decrypt } from "../utils/encryption";
import { SECRET } from "../utils/env";
import { IReqUser } from "../utils/interfaces";

// Validation Schemas
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
  identifier: Yup.string().required(),
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

// Controller Methods
export default {
  async profile(req: Request, res: Response) {
    const userId = (req as IReqUser).user.id;

    try {
      await validateProfileSchema.validate(req.body);

      await UserModel.updateOne({ _id: userId }, { ...req.body });

      const updatedProfile = await UserModel.findById(userId).select(
        "-password"
      );

      res.status(200).json({
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({
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
    const tokenKey =
      req.params.tokenKey || req.headers.authorization?.split(" ")[1];

    if (!tokenKey) {
      console.error("Token not provided");
      return res.status(400).json({ error: "Token not provided" });
    }

    try {
      console.log("Received token:", tokenKey);

      const decodedToken = jwt.verify(tokenKey, SECRET) as { id: string };
      console.log("Decoded token:", decodedToken);

      const user = await UserModel.findById(decodedToken.id).select(
        "-password"
      );

      if (!user) {
        console.log("User not found with ID:", decodedToken.id);
        return res.status(401).json({ error: "User is not logged in" });
      }

      console.log("Found user:", user);

      if (user.roles === "Customer") {
        const customer = await CustomerModel.findOne({
          user: user._id,
        }).populate("user");
        return res.status(200).json(customer || user);
      } else if (user.roles === "Seller") {
        const seller = await SellerModel.findOne({ user: user._id }).populate("user");
        return res.status(200).json(seller || user);
      } else {
        return res.status(200).json(user);
      }
    } catch (error) {
      console.error("Error during token verification or user retrieval:",error);
      return res.status(401).json({ error: "User is not logged in" });
    }
  },
  async login(req: Request, res: Response) {
    const { identifier, password } = req.body;

    try {
      await validateLoginSchema.validate({ identifier, password });

      const user = await UserModel.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerify === false) {
        return res.status(403).json({
          message: "Your account is not verified. Please check your email.",
        });
      }

      const decryptedPassword = decrypt(SECRET, user.password);

      if (password !== decryptedPassword) {
        return res.status(400).json({ message: "Email/Username and Password do not match" });
      }

      const token = jwt.sign({ id: user._id, roles: user.roles }, SECRET, {expiresIn: "6h",});

      res.status(200).json({
        message: "User logged in successfully",
        data: token,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({
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
    const { name, username, email, password } = req.body;

    try {
      await validateRegisterSchema.validate({
        name,
        username,
        email,
        password,
      });

      const user = new UserModel({ name, username, email, password });
      await user.save();

      if (user.roles === "Customer") {
        const customer = new CustomerModel({ user: user._id });
        await customer.save();
      }
      if (user.roles === "Seller") {
        const seller = new SellerModel({ user: user._id });
        await seller.save();
      }
      const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });
      const verifyUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/verify-email?token=${token}`;

      await sendVerificationEmail(user.email, user.name, verifyUrl);

      res.status(201).json({
        message: "User registered successfully. Please verify your email.",
        data: user,
      });
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        return res.status(400).json({
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
  },
};