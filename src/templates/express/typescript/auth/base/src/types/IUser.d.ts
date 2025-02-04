import { Document, ObjectId } from "mongoose";


interface IUser extends Document {
  firstname: string;
  lastname?: string;
  email: string;
  category: string | null;
  phone: {
    personal?: number;
    other?: number;
  };
  password: string;
  salt: string;
  resetPasswordToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt?: Date; 
  updatedAt?: Date; 
  comparePassword(candidatePassword: string): Promise<boolean>;
  getToken(): Promise<string>;
}

export default IUser;
