const express = require("express");
const app = express();
var addDays = require("/home/workspace/nodejs/coding-practices/coding-practice-3a/node_modules/date-fns/addDays");
app.get("/", (request, response) => {
  const date = new Date();
  const newDate = addDays(date, 100);
  response.send(
    `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear()}`
  );
});

app.listen(3000);
module.exports = app;
