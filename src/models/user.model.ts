import mongoose from "mongoose";
import { encrypt } from "../utils/encryption";
import { SECRET } from "../utils/env";

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    roles: {
      type: String,
      required: true,
      enum: ["Seller", "Customer"],
    },
    isVerify: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = encrypt(SECRET, user.password);
  }
  next();
});

UserSchema.pre("updateOne", async function (next) {
  const user = (this as unknown as { _update: any })._update;
  if (user.password) {
    user.password = encrypt(SECRET, user.password);
  }
  next();
});


UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const SellerSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ["Biasa", "Official Store"],
  },
});

const CustomerSchema = new Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
});

const UserModel = mongoose.model("User", UserSchema);
const SellerModel = UserModel.discriminator("Seller", SellerSchema);
const CustomerModel = UserModel.discriminator("Customer", CustomerSchema);

export { UserModel, SellerModel, CustomerModel };