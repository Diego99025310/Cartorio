const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const methodOverride = require('method-override');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const routes = require('./src/routes');
const { initializeDatabase } = require('./src/database');

const app = express();
const PORT = process.env.PORT || 5000;

initializeDatabase();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'src') }),
    secret: process.env.SESSION_SECRET || 'cartorio-torresan',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 // 1 hora
    }
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? {
        id: req.session.userId,
        username: req.session.username,
        isMaster: req.session.isMaster
      }
    : null;
  next();
});

app.use(routes);

app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página não encontrada',
    user: req.session
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
