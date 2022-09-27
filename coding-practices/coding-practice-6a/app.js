const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const stateObjectFromDb = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const districtObjectFromDb = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1
// Path: /states/
// Method: GET
// Description:
// Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM state;`;
  const allStateInfo = await db.all(getStateQuery);
  response.send(
    allStateInfo.map((eachObject) => stateObjectFromDb(eachObject))
  );
});

// API 2
// Path: /states/:stateId/
// Method: GET
// Description:
// Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIdQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const singleStateInfo = await db.get(getStateByIdQuery);
  response.send(stateObjectFromDb(singleStateInfo));
});

// API 3
// Path: /districts/
// Method: POST
// Description:
// Create a district in the district table, district_id is auto-incremented
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictInfoQuery = `
    INSERT INTO 
        district (district_name, state_id, cases, cured, active, deaths  )
    VALUES
        ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(postDistrictInfoQuery);
  response.send("District Successfully Added");
});

// ### API 4
// #### Path: `/districts/:districtId/`
// #### Method: `GET`
// #### Description:
// Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const singleDistrictInfo = await db.get(getDistrictByIdQuery);
  response.send(districtObjectFromDb(singleDistrictInfo));
});

// ### API 5
// #### Path: `/districts/:districtId/`
// #### Method: `DELETE`
// #### Description:
// Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// ### API 6
// #### Path: `/districts/:districtId/`
// #### Method: `PUT`
// #### Description:
// Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictByDistrictId = `
    UPDATE 
        district
    SET
        district_name = "${districtName}",
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths} 
    WHERE 
        district_id = ${districtId};`;
  await db.run(updateDistrictByDistrictId);
  response.send("District Details Updated");
});

// ### API 7
// #### Path: `/states/:stateId/stats/`
// #### Method: `GET`
// #### Description:
// Returns the statistics of total cases,
// cured, active, deaths of a specific state based on state ID
app.get(`/states/:stateId/stats/`, async (request, response) => {
  const { stateId } = request.params;
  const totalStatsQuery = `
      SELECT 
        SUM(cases) AS totalCases, 
        SUM(cured) AS totalCured, 
        SUM(active) AS totalActive, 
        SUM(deaths) AS totalDeaths
      FROM district
      WHERE state_id = ${stateId}
     ;`;
  const totalStatsArray = await db.get(totalStatsQuery);
  //   response.send({
  //     totalCases: totalStatsArray.cases,
  //     totalCured: totalStatsArray.cured,
  //     totalActive: totalStatsArray.active,
  //     totalDeaths: totalStatsArray.deaths,
  //   });
  response.send(totalStatsArray);
});

// ### API 8
// #### Path: `/districts/:districtId/details/`
// #### Method: `GET`
// #### Description:
// Returns an object containing the state name
// of a district based on the district ID
app.get(`/districts/:districtId/details/`, async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state_name
    FROM state INNER JOIN district ON state.state_id = district.state_id;`;
  const stateNameObj = await db.get(getStateNameQuery);
  response.send({
    stateName: stateNameObj.state_name,
  });
});

module.exports = app;
