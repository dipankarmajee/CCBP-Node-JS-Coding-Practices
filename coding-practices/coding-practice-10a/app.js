const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "covid19IndiaPortal.db");
let database = null;

const initializeAndDbAndServer = async () => {
  try {
    database = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log(`server is running on http://localhost:3000`);
    });
  } catch (error) {
    console.log(`Database error is ${error}`);
    process.exit(1);
  }
};
initializeAndDbAndServer();

// Login API 1
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  // check user
  const userDetailsQuery = `select * from user where username = '${username}';`;
  const userDetails = await database.get(userDetailsQuery);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordValid) {
      //get JWT Token
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "abc@123");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send(`Invalid password`);
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

// Authentication with Token
function authenticationToken(request, response, next) {
  let jwtToken;
  const authHeader = request.headers.authorization;
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "abc@123", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send(`Invalid JWT Token`);
        1;
      } else {
        next();
      }
    });
  } else {
    response.status(401);
    response.send(`Invalid JWT Token`);
  }
}

//API 2
const convertStateDbObject = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};
app.get("/states/", authenticationToken, async (request, response) => {
  const getStatesQuery = `select * from state;`;
  const getStates = await database.all(getStatesQuery);
  response.send(getStates.map((eachState) => convertStateDbObject(eachState)));
});

//API 3
app.get("/states/:stateId/", authenticationToken, async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `select * from state where state_id = ${stateId};`;
  const getStateDetails = await database.get(getStateDetailsQuery);
  response.send(convertStateDbObject(getStateDetails));
});

// API 4
app.post("/districts/", authenticationToken, async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths) 
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrict = await database.run(createDistrictQuery);
  response.send(`District Successfully Added`);
});

//API 5
const convertDbObjectDistrict = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get(
  "/districts/:districtId/",
  authenticationToken,
  async (request, response) => {
    const { districtId } = request.params;
    const getDistrictByIdQuery = `select * from district where district_id=${districtId};`;
    const getDistrictByIdQueryResponse = await database.get(
      getDistrictByIdQuery
    );
    response.send(convertDbObjectDistrict(getDistrictByIdQueryResponse));
  }
);

// API 6
app.delete(
  "/districts/:districtId/",
  authenticationToken,
  async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrictQuery = `delete from district where district_id = ${districtId};`;
    const deleteDistrict = await database.run(deleteDistrictQuery);
    response.send(`District Removed`);
  }
);

//API 7
app.put(
  "/districts/:districtId/",
  authenticationToken,
  async (request, response) => {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const updateDistrictQuery = `update district set
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;

    const updateDistrictQueryResponse = await database.run(updateDistrictQuery);
    response.send("District Details Updated");
  }
);

//API 8
app.get(
  "/states/:stateId/stats/",
  authenticationToken,
  async (request, response) => {
    const { stateId } = request.params;
    const getStateByIDStatsQuery = `select sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths from district where state_id = ${stateId};`;

    const getStateByIDStatsQueryResponse = await database.get(
      getStateByIDStatsQuery
    );
    response.send(getStateByIDStatsQueryResponse);
  }
);

module.exports = app;
