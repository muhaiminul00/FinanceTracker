// Password strength checker
export function checkPasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number (0-9)');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$...)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: password.length >= 12 && errors.length === 0 ? 'strong' : 
              password.length >= 8 && errors.length <= 1 ? 'medium' : 'weak'
  };
}

// Country phone validation rules
const countryRules = {
  BD: { name: 'Bangladesh', code: '+880', regex: /^01[3-9]\d{8}$/, length: 11, placeholder: '01712345678' },
  IN: { name: 'India', code: '+91', regex: /^[6-9]\d{9}$/, length: 10, placeholder: '9876543210' },
  US: { name: 'USA', code: '+1', regex: /^\d{10}$/, length: 10, placeholder: '2015550123' },
  UK: { name: 'UK', code: '+44', regex: /^7\d{9}$/, length: 10, placeholder: '7400123456' },
  PK: { name: 'Pakistan', code: '+92', regex: /^3\d{9}$/, length: 10, placeholder: '3012345678' },
  MY: { name: 'Malaysia', code: '+60', regex: /^1[0-9]\d{7,8}$/, length: 9, placeholder: '123456789' },
  SG: { name: 'Singapore', code: '+65', regex: /^[89]\d{7}$/, length: 8, placeholder: '81234567' },
  AE: { name: 'UAE', code: '+971', regex: /^5\d{8}$/, length: 9, placeholder: '501234567' },
  SA: { name: 'Saudi Arabia', code: '+966', regex: /^5\d{8}$/, length: 9, placeholder: '501234567' },
};

export function getCountryRules() {
  return countryRules;
}

export function validatePhone(phone, countryCode = 'BD') {
  const rule = countryRules[countryCode];
  if (!rule) return { isValid: false, error: 'Invalid country selected' };

  const clean = phone.replace(/\s/g, '').replace(/^\+/, '');

  if (!clean) {
    return { isValid: false, error: 'Phone number is required' };
  }

  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Phone number must contain only digits' };
  }

  if (!rule.regex.test(clean)) {
    return { isValid: false, error: `Invalid ${rule.name} number. Must be ${rule.length} digits starting with valid prefix.` };
  }

  return { isValid: true, error: null, formatted: `${rule.code} ${clean}` };
}

export function validateEmail(email) {
  if (!email) return { isValid: true, error: null }; // Email is optional

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: null };
}

export function validateName(name) {
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z\s\-'.]+$/.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  return { isValid: true, error: null };
}
