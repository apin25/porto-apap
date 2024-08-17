import { Request, Response } from"express";
import jwt from "jsonwebtoken";
import { UserModel } from"../models/user.model";
import { SECRET } from"../utils/env";

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is missing" });
    }

    const decoded = jwt.verify(token as string, SECRET) as { id: string };

    const user = await UserModel.findByIdAndUpdate(
      decoded.id,
      { isVerify: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.render("verification-success", { name: user.name });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(400).json({ message: "Invalid or expired token", data: (error as Error).message });
  }
};
