import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAmJyR4VaDrjoHjfE9llMWENlt_WgmA10E",
  authDomain: "ozonpvz-491308.firebaseapp.com",
  projectId: "ozonpvz-491308",
  storageBucket: "ozonpvz-491308.firebasestorage.app",
  messagingSenderId: "271177631547",
  appId: "1:271177631547:web:b87e352ba501c0225c591e",
  measurementId: "G-J5H9ETBFJ1",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
