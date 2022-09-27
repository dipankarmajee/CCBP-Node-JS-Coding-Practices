const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log(`Server Running at http//localhost:3000/`);
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const playerDetailsReturn = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const getAllPlayersIdAndNameQuery = `
    SELECT * FROM player_details;`;
  const getAllPlayersIdAndNameArray = await db.all(getAllPlayersIdAndNameQuery);
  response.send(
    getAllPlayersIdAndNameArray.map((eachItem) => playerDetailsReturn(eachItem))
  );
});

// API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSinglePlayerQuery = `SELECT *
    FROM player_details WHERE player_id = ${playerId};`;
  const getSinglePlayerObj = await db.get(getSinglePlayerQuery);
  response.send(playerDetailsReturn(getSinglePlayerObj));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerNameQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await db.run(updatePlayerNameQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT *
    FROM match_details WHERE match_id = ${matchId};`;
  const getSingleMatchObj = await db.get(getMatchDetailsQuery);
  response.send({
    matchId: getSingleMatchObj.match_id,
    match: getSingleMatchObj.match,
    year: getSingleMatchObj.year,
  });
});

const getAllMatchDetailsByPlayerIdDbObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchDetailsQuery = `
    SELECT * 
    FROM match_details INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_id = ${playerId};`;
  const getAllMatchDetailsArray = await db.all(getAllMatchDetailsQuery);
  response.send(
    getAllMatchDetailsArray.map((item) =>
      getAllMatchDetailsByPlayerIdDbObj(item)
    )
  );
});

const getAllPlayerDetailsByPlayerIdDbObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
// API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayerDetailsQuery = `
    SELECT * 
    FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE match_id = ${matchId};`;
  const getAllPlayerDetailsArray = await db.all(getAllPlayerDetailsQuery);
  response.send(
    getAllPlayerDetailsArray.map((item) =>
      getAllPlayerDetailsByPlayerIdDbObj(item)
    )
  );
});

// API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const getPlayerStatsArray = await db.get(getPlayerStatsQuery);
  response.send(getPlayerStatsArray);
});

module.exports = app;
