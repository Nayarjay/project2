"use strict";
const bcrypt = require('bcrypt');
const axios = require("axios");
const Sqlite = require('better-sqlite3');
let db = new Sqlite('controller/db.sqlite');
const fetch = require("node-fetch");


//create new user
function new_user(name, password){
  // Generate a salt
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  // Hash a password
  const hash = bcrypt.hashSync(password, salt);

  try {
    var insert = db.prepare('INSERT INTO users (name,mdp,datecrea,dateupdate,state) VALUES (?,?,?,?,?);').run(name, hash, getnowDate(), getnowDate(), 1);
    // If the insert succeeded, return the ID of the newly created user
    return insert.lastInsertRowid;
  } catch (error) {
    // If the error is a unique constraint violation, return 3
    if (error.message.includes("UNIQUE constraint failed")) {
      return 3;
    } else {
      // If the error is not a unique constraint violation, log the error and return null
      console.error(error);
      return null;
    }
  }
}

function checkLoginInput(name,password){
  var coordonne= db.prepare('SELECT * FROM users where name=? ').get(name);
  
     if(coordonne && bcrypt.compareSync(password, coordonne.mdp)){
        console.log(coordonne);
       return coordonne;
     }
     console.log(coordonne);
     return null;
      
}
function addtofavorite(iduser,idgame,thumbnail,description,title){
  try{
    var insert = db.prepare('INSERT INTO favorite (iduser,idgame,thumbnail,description,title) VALUES (?,?,?,?,?);').run(iduser,idgame,thumbnail,description,title);
  }catch(error){
    if (error.message.includes("UNIQUE constraint failed")) {
      return 3;
    } else {
      // If the error is not a unique constraint violation, log the error and return null
      console.error(error);
      return null;
    }
  }
 

}



async function checkIfGameIsInFavorites(userId, gameId) {
  const sql = 'SELECT * FROM favorite WHERE iduser = ? AND idgame = ?';
  const stmt = db.prepare(sql);
  const rows = await stmt.all(userId, gameId);
  return rows.length > 0;
}

function getFlashGames(idgame){
  var results = db.prepare('SELECT * from GAME where id = ?').get(idgame);
  console.log(results);
  return results;
  console.log(results);
}

function getFavoriteGames(iduser){
  var results = db.prepare('SELECT * from FAVORITE where iduser = ?').all(iduser);
  console.log(results);
  return results;
  console.log(results);
}

function getFlashGamesList() {
  // Assuming the db object is properly defined and connected
  var statement = 'SELECT * FROM GAME';
  var results = db.prepare(statement).all();
  //console.log(results);
  return results;
}

function deletefromfavorite(idgame){
  db.prepare('DELETE FROM favorite WHERE idgame = ?').run(idgame);
  return 1;
}




/////////////////////////////////////////////////////////////////

let options =null;

function GetGamesByTag(tag,support){
   return options = {
        method: 'GET',
        url: 'https://free-to-play-games-database.p.rapidapi.com/api/games',
        params: {platform: support, category: tag, 'sort-by': 'release-date'},
        headers: {
          'X-RapidAPI-Key': 'b5baf0e861msh5b61bf7a02b095ep133201jsn281e8c3c8a35',
          'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
        }
    };
}



function getGamesByPlateform(){
  return options = {
       method: 'GET',
       url: 'https://free-to-play-games-database.p.rapidapi.com/api/games',
       params: {'sort-by': 'release-date'},
       headers: {
         'X-RapidAPI-Key': 'b5baf0e861msh5b61bf7a02b095ep133201jsn281e8c3c8a35',
         'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
       }
   };
}


function getPopular(popularity){
   return options = {
        method: 'GET',
        url: 'https://free-to-play-games-database.p.rapidapi.com/api/games',
        params: { 'sort-by': 'popularity'},
        headers: {
          'X-RapidAPI-Key': 'b5baf0e861msh5b61bf7a02b095ep133201jsn281e8c3c8a35',
          'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
        }
    };
}


async function getGameDetails(id) {
  const myKey = 'b5baf0e861msh5b61bf7a02b095ep133201jsn281e8c3c8a35';

  try {
    const response = await fetch(`https://www.freetogame.com/api/game?id=${id}`, { cache: "no-cache" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}







  // Example usage
  
  






function GetGameList(){
    return options = {
        method: 'GET',
        url: 'https://free-to-play-games-database.p.rapidapi.com/api/games',
        headers: {
          'X-RapidAPI-Key': 'b5baf0e861msh5b61bf7a02b095ep133201jsn281e8c3c8a35',
          'X-RapidAPI-Host': 'free-to-play-games-database.p.rapidapi.com'
        }
    };
}



module.exports = {
    GetGamesByTag,
    getGameDetails,
    responseApiSearchBar,
    getPopular,
    GetGameList,
    responseApi2,
    getGameDetails,
    getGamesByPlateform,
    new_user,
    checkLoginInput,
    addtofavorite,
    checkIfGameIsInFavorites,
    getFlashGamesList,
    getFlashGames,
    responseApi3,
    deletefromfavorite,
    getFavoriteGames

};


//responseApi3 is used to get all  games and is filtred by a list of game tag and excluses some specific game 

function responseApi2(options) {
  const excludedGenres = ['Shooter', 'MOBA', 'mmofps', 'mmotps', 'mmorts', 'horror', 'ARPG', 'MMORPG'];
  return axios.request(options).then(function(response) {
    // filter
    let filteredData = response.data.filter(obj => {
      return obj.genre && 
             !excludedGenres.some(g => obj.genre.includes(g)) && 
             obj.title !== "Epic Cards Battle" && 
             obj.title !== "5Street"
             && obj.title !="Deathverse: Let It Die"
             ;
    });

    
    return filteredData.slice(0, response.data.length);
  }).catch(function(error) {
    console.error(error);
  });
}





function responseApiSearchBar(title, options) {
  const list = [];
  const excludedGenres = ['Shooter', 'MOBA', 'mmofps', 'mmotps', 'mmorts', 'horror','ARPG', 'MMORPG'];
  const capitalizedWord = title.toUpperCase();

  return axios.request(options).then(function (response) {
    const filteredData = response.data.filter(obj => {
      return obj.genre && !excludedGenres.some(g => obj.genre.includes(g));
    });

    filteredData.forEach(obj => {
      if (obj.title.toUpperCase().includes(capitalizedWord) && obj.title !="Epic Cards Battle" && obj.title !="5Street"&& obj.title !="Deathverse: Let It Die") {
       
        list.push(obj);
      }
    });

    return list;
  }).catch(function (error) {
    console.error(error);
  });
}

//responseApi3 is used to get only 21 element of game and is filtred by a list of game tag and excluses some specific game 

function responseApi3(options) {
  const excludedGenres = ['Shooter', 'MOBA', 'mmofps', 'mmotps', 'mmorts', 'horror', 'ARPG', 'MMORPG'];
  return axios.request(options).then(function(response) {
    // filter
    let filteredData = response.data.filter(obj => {
      return obj.genre && 
             !excludedGenres.some(g => obj.genre.includes(g)) && 
             obj.title !== "Epic Cards Battle" && 
             obj.title !== "5Street"
             && obj.title !="Deathverse: Let It Die"
             ;
    });


    return filteredData.slice(0, 21);
  }).catch(function(error) {
    console.error(error);
  });
}





// get clear date format readable by a human
//console.log(Date.now())
function getnowDate(){
  const now = new Date();
  const year = now.getFullYear();
  const month = ("0" + (now.getMonth() + 1)).slice(-2);
  const day = ("0" + now.getDate()).slice(-2);
  const hours = ("0" + now.getHours()).slice(-2);
  const minutes = ("0" + now.getMinutes()).slice(-2);
  const seconds = ("0" + now.getSeconds()).slice(-2);
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDate;
  console.log(formattedDate);
} 

