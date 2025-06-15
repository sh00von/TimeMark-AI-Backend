const supabase = require('../config/supabase');
const { logger } = require('../utils/logger');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      logger.error('Registration error:', error);
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'User already exists' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('Logout error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      logger.error('Get user error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

module.exports = {
  login,
  register,
  logout,
  getMe
}; 