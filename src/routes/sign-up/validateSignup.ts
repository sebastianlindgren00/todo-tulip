async function validateSignup(user: { username: string; email: string; name: string; password: string; confirmPassword: string; }) {
  const { username, email, name, password, confirmPassword } = user;

  // Check if username is empty
  if (!username) {
    return ({ error: 'Username is required' });
  }

  if (!name) {
    return ({ error: 'Name is required' });
  }

  // Check if email is empty
  if (!email) {
    return ({ error: 'Email is required' });
  }
  else if (!email.includes('@') || !email.includes('.')) {
    return ({ error: 'Invalid email' });
  }

  // Check if password is empty
  if (!password) {
    return ({ error: 'Password is required' });
  }
  else if (password.length < 8) {
    return ({ error: 'Password must be at least 8 characters long' });
  }

  if (password !== confirmPassword) {
    return ({ error: 'Passwords do not match' });
  }

  return
}

export default validateSignup;