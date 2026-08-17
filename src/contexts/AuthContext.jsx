import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { toTitleCase, sanitizeInput } from '../utils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// In-memory rate limiting tracker for login attempts
const loginAttempts = {
    count: 0,
    lockedUntil: 0
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setCurrentUser({ ...user, ...userDoc.data() });
                    } else {
                        setCurrentUser(user);
                    }
                } catch {
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const register = async (name, nickname, email, password) => {
        try {
            const cleanName = sanitizeInput(name);
            const cleanNickname = sanitizeInput(nickname);
            const cleanEmail = email?.trim().toLowerCase();

            if (!cleanEmail || !cleanEmail.includes('@')) {
                return { success: false, error: "Geçerli bir e-posta adresi giriniz." };
            }
            if (!password || password.length < 6) {
                return { success: false, error: "Şifre en az 6 karakter olmalıdır." };
            }

            const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password);

            // Update display name in Firebase Auth
            const formattedName = toTitleCase(cleanName);
            await updateFirebaseProfile(user, { displayName: formattedName });

            // Create user document in Firestore - strictly enforce default role 'user'
            const userData = {
                id: user.uid,
                name: formattedName,
                nickname: cleanNickname || formattedName,
                email: cleanEmail,
                createdAt: new Date().toISOString(),
                bio: '',
                socialLinks: { instagram: '', twitter: '', facebook: '', linkedin: '' },
                role: 'user'
            };

            await setDoc(doc(db, 'users', user.uid), userData);

            // Update local state immediately
            setCurrentUser({ ...user, ...userData });

            return { success: true };
        } catch (error) {
            console.error("Registration Error:", error);
            let errorMessage = "Kayıt oluşturulurken bir hata oluştu.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Bu e-posta adresi zaten kullanımda.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Şifre çok zayıf. En az 6 karakter olmalı.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Geçersiz e-posta adresi formatı.";
            }
            return { success: false, error: errorMessage };
        }
    };

    const login = async (email, password) => {
        // Rate limiting check
        const now = Date.now();
        if (loginAttempts.lockedUntil > now) {
            const remainingSeconds = Math.ceil((loginAttempts.lockedUntil - now) / 1000);
            return {
                success: false,
                error: `Çok fazla hatalı giriş denemesi. Lütfen ${remainingSeconds} saniye sonra tekrar deneyin.`
            };
        }

        try {
            const cleanEmail = email?.trim().toLowerCase();
            await signInWithEmailAndPassword(auth, cleanEmail, password);
            // Reset attempts on successful login
            loginAttempts.count = 0;
            loginAttempts.lockedUntil = 0;
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            loginAttempts.count += 1;
            
            // Progressive rate limiting: 5 failed attempts -> 30s lockout, 10 attempts -> 5m lockout
            if (loginAttempts.count >= 10) {
                loginAttempts.lockedUntil = Date.now() + 300000; // 5 minutes
            } else if (loginAttempts.count >= 5) {
                loginAttempts.lockedUntil = Date.now() + 30000; // 30 seconds
            }

            let errorMessage = "Giriş yapılırken bir hata oluştu.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "Hatalı e-posta veya şifre.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.";
            }
            return { success: false, error: errorMessage };
        }
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const { user } = await signInWithPopup(auth, provider);

            // Check if user document exists
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const userData = {
                    id: user.uid,
                    name: user.displayName || 'Kullanıcı',
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    bio: '',
                    socialLinks: { instagram: '', twitter: '', facebook: '', linkedin: '' },
                    photoURL: user.photoURL || '',
                    role: 'user'
                };
                await setDoc(userDocRef, userData);
                setCurrentUser({ ...user, ...userData });
            }

            return { success: true };
        } catch (error) {
            console.error("Google Login Error:", error);
            return { success: false, error: "Google ile giriş yapılamadı." };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch {
            return { success: false, error: "Çıkış yapılamadı." };
        }
    };

    const updateProfile = async (data) => {
        if (!currentUser) return { success: false, error: 'Giriş yapılmamış.' };

        try {
            const safeData = {};
            if (data.name) safeData.name = toTitleCase(sanitizeInput(data.name));
            if (data.nickname) safeData.nickname = sanitizeInput(data.nickname);
            if (data.bio !== undefined) safeData.bio = sanitizeInput(data.bio);
            if (data.socialLinks) safeData.socialLinks = data.socialLinks;
            if (data.photoURL) safeData.photoURL = data.photoURL;

            // Block field tampering: Prevent client from modifying id, email, role, or createdAt
            delete safeData.id;
            delete safeData.email;
            delete safeData.role;
            delete safeData.createdAt;

            const userDocRef = doc(db, 'users', currentUser.uid || currentUser.id);
            await updateDoc(userDocRef, safeData);

            if (safeData.name && auth.currentUser) {
                await updateFirebaseProfile(auth.currentUser, { displayName: safeData.name });
            }

            setCurrentUser(prev => ({ ...prev, ...safeData }));
            return { success: true };
        } catch (error) {
            console.error("Update Profile Error:", error);
            return { success: false, error: "Profil güncellenemedi." };
        }
    };

    const verifyEmail = async () => {
        return { success: true };
    };

    const value = {
        currentUser,
        login,
        register,
        verifyEmail,
        loginWithGoogle,
        logout,
        updateProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
