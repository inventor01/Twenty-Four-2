import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  type User,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from '../lib/firebase';
import { UserProfile, UserSettings, OnboardingAnswers } from '../types';
import { getStoredSettings } from '../db/store';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (answers: OnboardingAnswers) => Promise<void>;
  updateUserProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Subscribe to user profile document in firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            } else {
              // Create initial profile if first time
              const initialProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Practitioner',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: new Date().toISOString(),
                onboardingComplete: false,
                settings: getStoredSettings(),
              };
              await setDoc(userDocRef, initialProfile, { merge: true });
              setProfile(initialProfile);
            }
            setLoading(false);
          },
          (err) => {
            console.error('Profile snapshot error:', err);
            setLoading(false);
          }
        );

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      const userDocRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const initialProfile: UserProfile = {
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || 'Practitioner',
          photoURL: u.photoURL || undefined,
          createdAt: new Date().toISOString(),
          onboardingComplete: false,
          settings: getStoredSettings(),
        };
        await setDoc(userDocRef, initialProfile, { merge: true });
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
    const userDocRef = doc(db, 'users', cred.user.uid);
    const initialProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: name || 'Practitioner',
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
      settings: getStoredSettings(),
    };
    await setDoc(userDocRef, initialProfile, { merge: true });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const completeOnboarding = async (answers: OnboardingAnswers) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updates: Partial<UserProfile> = {
      displayName: answers.displayName || profile?.displayName || 'Practitioner',
      primaryFocus: answers.primaryFocus,
      targetSleepHours: answers.targetSleepHours,
      targetDeepWorkHours: answers.targetDeepWorkHours,
      intentions: answers.intentions,
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, updates, { merge: true });
  };

  const updateUserProfile = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      completeOnboarding,
      updateUserProfile,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
