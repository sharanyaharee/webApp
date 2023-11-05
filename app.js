
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo');
//const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 3030
const session = require('express-session')
//const { findUserByEmail } = require('./utils'); 
const User = require('./model/user')


//connect to DB
const dbURI = 'mongodb://127.0.0.1:27017/myDb1'
mongoose.connect(dbURI)
.then((result)=>app.listen(PORT))
.catch((err)=>console.log(err))

//set view engine
app.set('view engine','ejs')



//static files
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

//creating a session
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl:dbURI })  ,
    cookie:{
        name:'myCookie',
        maxAge:1000*60*60*2,
        sameSite: true,
         }
           
  }));

// caching disabled for every route
app.use(function(req, res, next) {
  res.set('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
//get routes
app.get('/',(req,res)=>{
  const message = req.query.message;
  if(req.session.user){
    res.redirect('/home' )
  }else{
    res.render('login',{message})
}
})

app.get('/register', (req,res)=>{
  const message = req.query.message;
    res.render('register',{message})
})

app.get('/admin-login', (req,res)=>{
  const message = req.query.message;
    res.render('admin',{message})
})

app.get('/home', (req, res) => {
  if (req.session.user) {
    res.render('home');
  } else {
    
    res.redirect('/?message=Please Login!!');
  }
});


app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !password) {
    return res.render('register', { message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { message: 'Email already in use! please Login' });
    }
    const newUser = new User({
      name,
      email,
      password 
    });
    await newUser.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send(error.message);
  }
});





 //login post route
  app.post('/', async (req, res) => {
    const { email, password } = req.body;
    if(email && password){
      try {
        const user = await User.findOne({ email });
        if (!user) {
          res.redirect('/?message=Invalid Credentials!!');
        } else {
          const passwordMatch = (password === user.password);
          if (!passwordMatch) {
            res.redirect('/?message=Wrong Password!!');
          } else {
            req.session.user = user;
            res.redirect('/home');
          }
        }
      } catch (error) {
        res.redirect('/?message=Please Enter your Credentials!');
      }
    } else {
      res.redirect('/?message=Please provide email and password');
    }
});

  
//logout post route
app.post('/logout', (req, res) => {
    res.clearCookie('myCookie');
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      // res.set() 
      res.header('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
       res.redirect('/?message=Successfully Logged out!',);
    });
  });
  

 //admin post route
 app.post('/admin-login', (req, res) => {
  const { adminMail, password } = req.body;

  const AdminMail = 'admin@admin.com';
  const AdminPassword = 'password';

  if (adminMail && password) {
    if (adminMail === AdminMail && password === AdminPassword) {
      req.session.admin = { adminMail: AdminMail }; // Store admin info in session
      res.redirect('/admin-dashboard');
    } else {
      res.render('admin', { message: 'Invalid admin credentials' });
    }
  } else {
    res.render('admin', { message: 'Please enter admin credentials' });
  }
});


 // admin-dashboard get
app.get('/admin-dashboard', async (req, res) => {
  // const message = req.query.message; 
    try {
      if (req.session.admin) {
        const users = await User.find(); 
        res.render('admin-dashboard', { users});
       
      } else {
        res.redirect('/admin-login');
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });


//   // admin-dashboard update Post route
  
  app.post('/admin-dashboard/update/:id', async (req, res) => {
    const userId = req.params.id; 
    const { name, email, password } = req.body;

    if (!userId || !name || !email || !password) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { name, email, password }, { new: true });

        if (!updatedUser) {
            return res.status(404).send('User not found');
        }
        
      
        res.redirect('/admin-dashboard');
    } catch (error) {
        res.status(500).send(error.message);
    }
});



 //admin dashboard create user Post  Route
app.post('/admin-dashboard/create', async (req, res) => {
    const { name, email, password } = req.body;
  
    try {
      const newUser = new User({
        name,
        email,
        password 
      });
      await newUser.save()
      res.redirect('/admin-dashboard');
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  


 //delete user Route
 app.delete('/admin-dashboard/delete/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.json({ success: false, message: 'Error deleting user' });
  }
});