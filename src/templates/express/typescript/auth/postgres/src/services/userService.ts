import prisma from '../db/db';
import crypto from 'crypto';

export const comparePassword = async (user: any, candidatePassword: string): Promise<boolean> => {
  try {
    const hashedPassword = await new Promise((resolve, reject) => {
      crypto.pbkdf2(
        candidatePassword,
        user.salt,
        1000,
        64,
        'sha512',
        (err, derivedKey) => {
          if (err) reject(err);
          resolve(derivedKey.toString('hex'));
        },
      );
    });

    return hashedPassword === user.password;
  } catch (error) {
    throw new Error('Error comparing password.');
  }
};

export const generateResetToken = async (userId: number): Promise<string> => {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  await prisma.user.update({
    where: { id: userId },
    data: {
      resetPasswordToken,
      resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return resetToken;
};