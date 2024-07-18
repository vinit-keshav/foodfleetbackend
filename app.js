
require('dotenv').config();
const express = require("express")
const mongoose = require('mongoose');
const collection = require("./mongo.js")
const session = require('express-session');
const StudentOrder = require("./StudentOrders.js");
const ItemRequest = require("./ItemRequest.js");
const MenuItem = require('./MenuItem.js')
const User = require('./mongoo.js');
const MongoStore = require('connect-mongo');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cors = require("cors")
const bodyParser = require('body-parser');
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(cors())
const port = process.env.PORT || 8000

const corsOptions = {
  origin: process.env.CORS_ORIGIN, 
  credentials: true, 
};

app.use(cors(corsOptions));




mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


  app.use(bodyParser.json());

app.use(session({
  secret:  process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE,
    collectionName: 'sessions'
  }),
  cookie: {
     secure: process.env.NODE_ENV === 'production',  
     httpOnly: true,
     sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',maxAge: 3600000
  }
}));

app.use((req, res, next) => {
  console.log('Session:', req.session.email);
  next();
});

app.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await collection.findOne({ email: email });

    if (user && user.password === password) {
     
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '1h' 
      });

      
      req.session.email = user.email;

     
      res.json({
        status: "success",
        token: token,
        user: { firstName: user.firstName, rollNo: user.rollNo }
      });
    } else {
      res.status(401).json({ status: "error", message: "Incorrect email or password" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ status: "error", message: "An error occurred. Please try again." });
  }
});



function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Unauthorized: Malformed token' });
  }

  const accessToken = tokenParts[1];

  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    
    console.log('Decoded Token Payload:', decoded); 
    req.email = decoded.email; 
    
    next();
  });
}




app.get('/getUserDetails', verifyToken, async (req, res) => {
  try {
    const user = await collection.findOne({ email: req.email });
    
    if (user) {
      res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        rollNo: user.rollNo,
        uniqueID: user.uniqueID,
        instituteName: user.instituteName
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



app.get('/getMenuItems/:uniqueID', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ uniqueID: req.params.uniqueID });
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


app.get("/signout", verifyToken, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.json({ status: "error", message: "Failed to sign out" });
    } else {
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.json({ status: "success", message: "Signed out successfully" });
    }
  });
});


app.post('/saveOrder', verifyToken, async (req, res) => {
  try {
    const user = await collection.findOne({ email: req.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { orders, totalPrice } = req.body;

    const existingStudentOrder = await StudentOrder.findOne({ rollNo: user.rollNo });

    if (existingStudentOrder) {
      existingStudentOrder.totalPrice += totalPrice;
      existingStudentOrder.orders = existingStudentOrder.orders.concat(orders);
      await existingStudentOrder.save();
      res.status(200).json({ message: 'Order updated successfully' });
    } else {
      const newStudentOrder = new StudentOrder({
        firstName: user.firstName,
        lastName: user.lastName,
        rollNo: user.rollNo,
        orders,
        uniqueID: user.uniqueID,
        totalPrice
      });
      await newStudentOrder.save();
      res.status(201).json({ message: 'Order saved successfully' });
    }

    // Update availableQuantity in MenuItem documents
    for (const orderItem of orders) {
      const menuItem = await MenuItem.findOne({ itemName: orderItem.name });
      if (menuItem) {
        menuItem.availableQuantity -= orderItem.quantity;
        await menuItem.save();
      } else {
        console.error(`MenuItem not found for order item: ${orderItem.name}`);
        // Handle the case where MenuItem is not found (maybe alert or log)
      }
    }

  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});








app.post('/signupp', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      req.session.email = user.email;
      req.session.save(err => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: 'Error saving session' });
        }
         console.log("Session after setting email:", req.session.email);
        res.status(200).json({ 
          message: 'Login successful!',
          email:user.email, 
          uniqueID: user.uniqueID,
          firstName: user.firstName,
          rollNo: user.rollNo 
        });
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, rollNo, email, password, instituteName, uniqueID } = req.body;
    console.log('Signup request body:', req.body);
    
    const existingUserByEmail = await collection.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    
    const existingUserByRollNo = await collection.findOne({ rollNo });
    if (existingUserByRollNo) {
      return res.status(400).json({ message: "User with this roll number already exists" });
    }
    
    const newUser = new collection({
      firstName,
      lastName,
      rollNo,
      email,
      password,
      instituteName,
      uniqueID
    });
    
    await newUser.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error details:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `Duplicate key error: A user with this ${field} already exists.` });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});



app.get('/students', async (req, res) => {
  try {
    const { uniqueID } = req.query;
    // console.log('Fetching students with uniqueID:', uniqueID);
    // console.log('Fetching students with uniqueID:', uniqueID);
    const students = await collection.find({ uniqueID: Number(uniqueID) });
    // console.log('Fetched students:', students);
    // console.log('Fetched email:', req.session.email);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body, uniqueID: Number(req.body.uniqueID) };
    // console.log('Updating student with ID:', id, 'Data:', updatedData);
    const updatedStudent = await collection.findByIdAndUpdate(id, updatedData, { new: true });
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uniqueID } = req.query;
    // console.log('Deleting student with ID:', id, 'and uniqueID:', uniqueID);
    await collection.findOneAndDelete({ _id: id, uniqueID: Number(uniqueID) });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});







app.get('/student-order', async (req, res) => {
  try {
    const { rollNo, uniqueID } = req.query;
    // console.log('Fetching order total for rollNo:', rollNo, 'and uniqueID:', uniqueID);
    const studentOrder = await StudentOrder.findOne({ rollNo, uniqueID: Number(uniqueID) });
    
    if (!studentOrder) {
      return res.status(404).json({ message: 'Student order not found' });
    }
    
    res.json({ totalPrice: studentOrder.totalPrice });
  } catch (error) {
    console.error('Error fetching student order total:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/student-orders', async (req, res) => {
  try {
  const { uniqueID } = req.query;

  const studentOrders = await StudentOrder.find({ uniqueID: Number(uniqueID) });
  
  if (!studentOrders || studentOrders.length === 0) {
    return res.status(404).json({ message: 'No student orders found' });
  }
  
  res.json(studentOrders);
  } catch (error) {
  console.error('Error fetching student orders:', error);
  res.status(500).json({ message: 'Internal server error' });
  }
  });

app.put('/student-order/subtract', async (req, res) => {
  try {
    const { rollNo, uniqueID, amountToSubtract } = req.body;
    const studentOrder = await StudentOrder.findOne({ rollNo, uniqueID: Number(uniqueID) });

    if (!studentOrder) {
      return res.status(404).json({ message: 'Student not found' });
    }

    studentOrder.totalPrice -= amountToSubtract;
    
    if (studentOrder.totalPrice < 0) {
      studentOrder.totalPrice = 0; // Ensure totalPrice doesn't go below zero
    }

    await studentOrder.save();
    res.json({ message: 'Total price updated successfully', totalPrice: studentOrder.totalPrice });
  } catch (error) {
    console.error('Error updating total price:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/menu-items', async (req, res) => {
  const { itemName, price, availableQuantity, uniqueID } = req.body;
  
  try {
    const menuItem = new MenuItem({
      itemName,
      price,
      availableQuantity,
      uniqueID
    });
    
    await menuItem.save();
    res.status(201).json({ message: 'Menu item added successfully' });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Error adding menu item' });
  }
});
app.get('/menu-items/:uniqueID', async (req, res) => {
  const { uniqueID } = req.params;
  try {
    const menuItems = await MenuItem.find({ uniqueID });
    res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Error fetching menu items' });
  }
});

app.put('/menu-items/:id', async (req, res) => {
  const { id } = req.params;
  const { itemName, price, availableQuantity } = req.body;
  try {
    await MenuItem.findByIdAndUpdate(id, { itemName, price, availableQuantity });
    res.status(200).json({ message: 'Menu item updated successfully' });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Error updating menu item' });
  }
});


app.delete('/menu-items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await MenuItem.findByIdAndDelete(id);
    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Error deleting menu item' });
  }
});
app.post('/changePassword', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    const user = await collection.findOne({ email: req.email }); // Using req.email from verifyToken middleware
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});




app.post('/changeAdminPassword', async (req, res) => {
  try {
    if (!req.session.email) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const { newPassword } = req.body;
    
    const user = await User.findOne({ email: req.session.email });
    console.log(req.session.email)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user's password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



app.post('/requestItem', async (req, res) => {
  const { firstName, lastName, rollNo, uniqueID, mealType, itemName } = req.body;

  try {
    const newItemRequest = new ItemRequest({
      firstName,
      lastName,
      rollNo,
      uniqueID,
      mealType,
      itemName
    });

    await newItemRequest.save();
    res.status(201).json({ message: 'Item request submitted successfully' });
  } catch (error) {
    console.error('Error submitting item request:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


app.get('/item-requests', async (req, res) => {
  try {
    const { uniqueID } = req.query;
   
    
    const itemRequests = await ItemRequest.find({ uniqueID: Number(uniqueID) });
    console.log('Query result:', itemRequests);
    
    if (!itemRequests || itemRequests.length === 0) {
      console.log('No item requests found');
      return res.status(404).json({ message: 'No item requests found' });
    }
    
    res.json(itemRequests);
  } catch (error) {
    console.error('Error fetching item requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = verifyToken;
module.exports = router;
app.listen(port,()=>{
  console.log(`port connected ${port}`);
})




