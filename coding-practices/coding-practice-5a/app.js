const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertMoviesTable = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorsTable = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

// 1. API - GET Method - movies - done
app.get("/movies/", async (request, response) => {
  const getMoviesListQueryAll = `
    SELECT movie_name FROM movie;`;
  const movieListAll = await db.all(getMoviesListQueryAll);
  response.send(movieListAll.map((eachMovie) => convertMoviesTable(eachMovie)));
});

//2. API - POST Method
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovieQuery = `
        INSERT INTO movie (director_id, movie_name, lead_actor)
        VALUES (${directorId}, '${movieName}', '${leadActor}');`;

  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//3. API - GET Method - single movie - done
app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQueryBySingle = `
    SELECT * FROM movie WHERE movie_id = '${movieId}';`;

  const movieListBySingle = await db.get(getMovieQueryBySingle);
  response.send(convertMoviesTable(movieListBySingle));
});

//4. API - POST Method - movie
app.put("/movies/:movieId", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
        UPDATE 
            movie 
        SET 
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE 
            movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//5. API - DELETE Method - single movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE FROM 
        movie 
    WHERE 
        movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//6. API -  GET Method - directors - done
app.get("/directors/", async (request, response) => {
  const getDirectorListQuery = `
    SELECT * FROM director;`;
  const directorList = await db.all(getDirectorListQuery);
  //   response.send(directorList);
  response.send(
    directorList.map((eachMovie) => convertDirectorsTable(eachMovie))
  );
});

//7. API - GET Method - single movie by director
app.get("/directors/:directorId/movies", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovieQuery = `
        SELECT 
            movie_name 
        FROM 
            movie
        WHERE 
            director_id = ${directorId};`;

  const movieListByDirector = await db.all(getDirectorMovieQuery);
  response.send(
    movieListByDirector.map((eachMovie) => ({
      movieName: eachMovie.movie_name,
    }))
  );
});

module.exports = app;
