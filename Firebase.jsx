import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDKnKgqc5voVorEYpsTWgM6gM17LLytZtg",
    authDomain: "phone-line-cb413.firebaseapp.com",
    projectId: "phone-line-cb413",
    storageBucket: "phone-line-cb413.appspot.com",
    messagingSenderId: "426987510181",
    appId: "1:426987510181:web:84f366f8fc43ea4943704c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore();
export const analytics = getAnalytics(app);