const User = require('../models/user');
const bcrypt = require('bcryptjs');
const mailgun = require('mailgun-js')({ apiKey: '30d05b8304b26aa82d7c459f02e83c35-db4df449-8ed5d81f', domain: 'sandbox6cda439f667f454699dfac316e6dae5a.mailgun.org' })
const crypto = require('crypto');


exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false
  });
};
exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          res.redirect('/login');
        })
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (user) {
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            name: name,
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
          var data = { //tempmail
            from: 'Backend-NodeJS-User <ni19852011@gmail.com>',
            to: email,
            subject: 'Welcome to our site!',
            html: '<h1>You successfully signed up! Welcome to our site!</h1>'
          }
          return mailgun.messages().send(data, function (error, body) {
            console.log(body);
          });
        })
        .catch(err => {
          console.log(err);
        })
    })
    .catch(err => {
      console.log(err);
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    isAuthenticated: false
  })
}
exports.postReset = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          console.log('No user found!');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        //user.resetTokenExpiration = Date.now() + 3600000; //ms
        user.resetTokenExpiration = new Date(); //ms
        user.save();
      })
      .then(result => {
        var data = {
          from: 'Backend-NodeJS-User <ni19852011@gmail.com>',
          to: email,
          subject: 'Password Reset!',
          html: `
          <p>Your requested for a password reset</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
          `
        }
        return mailgun.messages().send(data, function (error, body) {
          console.log(body);
        });
      })
      .catch(err=>{
        console.log(err);
      });
  });
};

