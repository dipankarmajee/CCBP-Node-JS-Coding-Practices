const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const passLength = (password) => password.length > 4;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// const validatePassword = (password) => {
//   return password.length > 4;
// };

// API - 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(userQuery);

  if (dbUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender, location)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'  
      );`;
    if (passLength(password)) {
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API - 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const loginQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const loginUser = await db.get(loginQuery);

  if (loginUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, loginUser.password);
    if (isPassword === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API - 3
// app.put("/change-password/", async (request, response) => {
//   const { username, oldPassword, newPassword } = request.body;
//   const passwordChangeQuery = `SELECT * FROM user WHERE username = '${username}';`;
//   const dbResponse = await db.get(passwordChangeQuery);

//   if (dbResponse === undefined) {
//     response.status(400);
//     response.send("Invalid User");
//   } else {
//     const isOldPassword = bcrypt.compare(oldPassword, dbResponse.password);
//     if (isOldPassword === true) {
//       // to be continued.......
//       if (passLength(newPassword)) {
//         const hashedNewPass = bcrypt.hash(newPassword, 10);
//         const updateNewPassQuery = `
//             UPDATE user
//             SET password = '${hashedNewPass}'
//             WHERE username = '${username}';`;
//         const userPassStatus = await db.run(createNewPassQuery);
//         response.send("Password updated");
//       } else {
//         response.status(400);
//         response.send("Password is too short");
//       }
//     } else {
//       response.status(400);
//       response.send("Invalid current password");
//     }
//   }
// });

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);
  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      if (passLength(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        const user = await db.run(updatePasswordQuery);

        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
