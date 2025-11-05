const bcrypt = require('bcryptjs');
const User = require('../models/User');

const showLogin = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Login', error: null, layout: false });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Usuário ou senha inválidos.',
        layout: false
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Usuário ou senha inválidos.',
        layout: false
      });
    }

    req.session.userId = user.id;
    req.session.isMaster = !!user.is_master;
    req.session.username = user.username;

    return res.redirect('/');
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).render('login', {
      title: 'Login',
      error: 'Ocorreu um erro ao realizar o login.',
      layout: false
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = {
  showLogin,
  login,
  logout
};
