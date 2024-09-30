const express = require('express')
const sqlite3 = require('sqlite3').verbose()

const path = require('path')
const {open} = require('sqlite')


const app = express()
const PORT = 3008;

const dbPath = path.join(__dirname, 'smokeTrees.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`)
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// Middleware to parse JSON bodies
app.use(express.json())



// Function to create User and Address tables
const createTables = async () => {
    const userTableQuery = `
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );`;
  
    const addressTableQuery = `
      CREATE TABLE IF NOT EXISTS Address (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        address TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      );`;
  
    try {
      await db.run(userTableQuery);
      await db.run(addressTableQuery);
      console.log('Tables "User" and "Address" created or already exist');
    } catch (err) {
      console.error('Error creating tables:', err.message);
    }
  };
  
  // Endpoint to create the tables
  app.get('/createtables', async (req, res) => {
    await createTables();
    res.send('Tables created successfully');
  });




// POST endpoint to register a user
app.post('/register', async (req, res) => {
    const { name, address } = req.body;
  
    if (!name || !address) {
      return res.status(400).send('Name and address are required');
    }
  
    try {
      const userInsertQuery = `
        INSERT INTO User (name)
        VALUES (?);
      `;
      const result = await db.run(userInsertQuery,[name]);

      // Get the newly created user's ID
      const userId = result.lastID;
  
      const addressInsertQuery = `
        INSERT INTO Address (userId, address)
        VALUES (?, ?);
      `;
      const result2 =  await db.run(addressInsertQuery,[userId,address]);
  
      res.status(201).send('User and address registered successfully');
    } catch (err) {
      console.error('Error registering user:', err.message);
      res.status(500).send('Internal Server Error');
    }
  });




// I have written the below code for my testing purpose on Postman.
// GET endpoint to fetch all users
app.get('/users', async (req, res) => {
    try {
      const getUsersQuery = `
        SELECT * FROM User LEFT JOIN Address;
      `;
      const users = await db.all(getUsersQuery);
      res.status(200).json(users)
    } catch (err) {
      console.error('Error fetching users:', err.message);
      res.status(500).send('Internal Server Error');
    }
  });
// GET endpoint to fetch all useraAddress
app.get('/getaddress', async (req, res) => {
    try {
      const getUsersQuery = `
        SELECT * FROM Address;
      `;
      const users = await db.all(getUsersQuery);
      res.status(200).json(users);
    } catch (err) {
      console.error('Error fetching Address:', err.message);
      res.status(500).send('Internal Server Error');
    }
  });

// DELETE endpoint to delete all rows from User and Address tables
app.delete('/deleteall', async (req, res) => {
  try {
    const deleteAddressesQuery = `DELETE FROM Address;`;
    const deleteUsersQuery = `DELETE FROM User;`;

    await db.run(deleteAddressesQuery);
    await db.run(deleteUsersQuery);

    res.status(200).send('All rows deleted from User and Address tables');
  } catch (err) {
    console.error('Error deleting rows:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

// DELETE endpoint to drop User and Address tables
app.delete('/droptables', async (req, res) => {
  try {
    const dropAddressTableQuery = `DROP TABLE IF EXISTS Address;`;
    const dropUserTableQuery = `DROP TABLE IF EXISTS User;`;

    await db.run(dropAddressTableQuery);
    await db.run(dropUserTableQuery);

    res.status(200).send('Tables "User" and "Address" dropped successfully');
  } catch (err) {
    console.error('Error dropping tables:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

  

module.exports = app
