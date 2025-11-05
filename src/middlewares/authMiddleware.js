const ensureAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.locals.currentUser = {
    id: req.session.userId,
    username: req.session.username,
    isMaster: req.session.isMaster
  };
  next();
};

const ensureMaster = (req, res, next) => {
  if (!req.session.isMaster) {
    return res.status(403).render('403', {
      title: 'Acesso negado',
      user: req.session
    });
  }
  next();
};

module.exports = {
  ensureAuthenticated,
  ensureMaster
};
