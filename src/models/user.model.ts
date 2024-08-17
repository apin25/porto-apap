import mongoose from "mongoose";
import { encrypt } from "../utils/encryption";
import { SECRET } from "../utils/env";

const Schema = mongoose.Schema;

// Skema User
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
      default: "Customer",
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

// Hash password sebelum menyimpan atau mengupdate
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

// Metode untuk menghapus password dari JSON output
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Skema Seller
const SellerSchema = new Schema({
  seller_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: function () {
      return new mongoose.Types.ObjectId(); // Otomatis menghasilkan ObjectId
    },
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ["Biasa", "Official Store"],
  },
});

// Skema Customer
const CustomerSchema = new Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: function () {
      return new mongoose.Types.ObjectId(); // Otomatis menghasilkan ObjectId
    },
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

// Model Mongoose
const UserModel = mongoose.model("User", UserSchema);
const SellerModel = mongoose.model("Seller", SellerSchema);
const CustomerModel = mongoose.model("Customer", CustomerSchema);

export { UserModel, SellerModel, CustomerModel };