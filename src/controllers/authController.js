// =============================================================
// File: controllers/authController.js
// Is code ko 'controllers' folder ke andar 'authController.js' naam se save karein.
// =============================================================
import { auth as _auth, firestore } from 'firebase-admin';
import { saveUserDataToDrive } from '../helpers/googleDriveHelper.js';

const db = firestore();
const auth = _auth();

export const registerUser = async (req, res) => {
  const { email, password, name, mobile } = req.body;

  if (!email || !password || !name || !mobile) {
    return res.status(400).json({ message: 'Kripya sabhi anivarya fields bharein.' });
  }

  try {
    // Firebase Authentication mein user banayein
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      phoneNumber: `+91${mobile}` // Maan rahe hain ki number Indian hai
    });

    // Firestore mein user ki extra details save karein
    const userData = {
      name: name,
      email: email,
      mobile: mobile,
      createdAt: new Date()
    };
    await db.collection('users').doc(userRecord.uid).set(userData);

    // Google Drive mein user ka data save karein (bina password ke)
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
