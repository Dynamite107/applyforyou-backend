// File: server/controllers/authController.js
// (Ismein badlav kiya gaya hai)
// =============================================================
// **FIX:** Firebase import ka tarika badla gaya
import admin from 'firebase-admin';
import { saveUserDataToDrive } from '../helpers/googleDriveHelper.js';

const db = admin.firestore();
const auth = admin.auth();

export const registerUser = async (req, res) => {
  const { email, password, name, mobile } = req.body;

  if (!email || !password || !name || !mobile) {
    return res.status(400).json({ message: 'Kripya sabhi anivarya fields bharein.' });
  }

  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      phoneNumber: `+91${mobile}`
    });

    const userData = {
      name: name,
      email: email,
      mobile: mobile,
      createdAt: new Date()
    };
    await db.collection('users').doc(userRecord.uid).set(userData);

    saveUserDataToDrive({ ...userData, uid: userRecord.uid });

    res.status(201).json({ message: 'User safaltapoorvak register ho gaya.', uid: userRecord.uid });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: 'Yeh email pehle se register hai.' });
    }
    res.status(500).json({ message: 'Registration fail ho gaya. Kripya dobara koshish karein.', error: error.message });
  }
};
