import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Colors from '../constants/Colors';

const EmailAuthForm = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const { signInWithEmail, signUpWithEmail, resetPassword, authError } = useAuth();

  const validateForm = () => {
    setError('');
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!resetMode && !password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (isSignUp) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      console.log(`Attempting to ${resetMode ? 'reset password' : isSignUp ? 'sign up' : 'sign in'}`);
      
      if (resetMode) {
        await resetPassword(email);
        setResetSent(true);
        console.log('Password reset email sent');
      } else if (isSignUp) {
        const user = await signUpWithEmail(email, password, displayName);
        console.log('Signup successful', user);
      } else {
        const user = await signInWithEmail(email, password);
        console.log('Login successful', user);
      }
    } catch (err) {
      // The error will be set in AuthContext and available via authError
      console.log('Error in form handler:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setResetMode(false);
  };

  const toggleResetMode = () => {
    setResetMode(!resetMode);
    setError('');
    setResetSent(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {resetMode ? "Reset Password" : isSignUp ? "Create Account" : "Login with Email"}
      </Text>
      
      {authError && <Text style={styles.errorText}>{authError}</Text>}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {resetSent && (
        <View style={styles.resetSentContainer}>
          <Text style={styles.resetSentText}>Password reset email sent! Check your inbox.</Text>
          <TouchableOpacity onPress={toggleResetMode} style={styles.linkButton}>
            <Text style={styles.linkText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!resetSent && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}
          
          {!resetMode && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          )}
          
          {isSignUp && !resetMode && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
          
          {!isSignUp && !resetMode && (
            <TouchableOpacity onPress={toggleResetMode} style={styles.linkButton}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
          
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>
                {resetMode ? "Send Reset Link" : isSignUp ? "Sign Up" : "Login"}
              </Text>
            )}
          </Pressable>
          
          <TouchableOpacity onPress={toggleMode} style={styles.linkButton}>
            <Text style={styles.linkText}>
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
          
          {resetMode && (
            <TouchableOpacity onPress={toggleResetMode} style={styles.linkButton}>
              <Text style={styles.linkText}>Back to login</Text>
            </TouchableOpacity>
          )}
          
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    fontFamily: 'Roboto-bold',
    fontSize: 24,
    color: Colors.PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Roboto-med',
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.GRAY,
  },
  buttonText: {
    color: '#ffffff',
    fontFamily: 'Roboto-med',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.PRIMARY,
    fontFamily: 'Roboto-med',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Roboto-reg',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
  },
  closeText: {
    color: Colors.GRAY,
    fontFamily: 'Roboto-med',
  },
  resetSentContainer: {
    alignItems: 'center',
    padding: 10,
  },
  resetSentText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Roboto-med',
  },
});

export default EmailAuthForm;