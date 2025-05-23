"use strict"
//acces restreint 
//const Sqlite = require('better-sqlite3');
const bcrypt = require('bcrypt');
let fs = require('fs');
//let db = new Sqlite('db.sqlite');
const axios = require("axios");
//cookie
const cookieSession = require('cookie-session');



/* Serveur pour le site de recettes */
var express = require('express');
var mustache = require('mustache-express');

var model = require('../model/model');
var app = express();
// Définition du dossier pour les fichiers statiques (images, CSS, etc.)

app.use(express.static('public'));

// parse form arguments in POST requests
const bodyParser = require('body-parser');
const { rawListeners, title } = require('process');
const { Console } = require('console');
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', '../view');
app.use(express.static('./view/css'));
app.use(express.static('./view/image'))

app.use(cookieSession({
  secret: 'mot-de-passe-du-cookie',
}));
app.use(authenticated);
//app.use(change_header);

function is_authenticated(req, res, next) {
 
  if (!req.session.userid) {
   // res.redirect('/not_authenticated')
    return res.redirect('/login')
    
  }
  
  next();
}
function authenticated(req, res, next) {
  if(req.session.userid && req.session){
    res.locals.authenticated =true;
    res.locals.name = req.session.name;
   
  }else{
    // la session n'est pas valide
    res.locals.authenticated = false;
  }
 
  next();
}
/**** Routes pour voir les pages du site ****/

/* Retourne une page principale avec le nombre de recettes */
app.get('/', (req, res) => {
  var found;
  var foundpc;
  model.responseApi3(model.getGamesByPlateform()) 
  .then(function(response2) {
    //found = { games: response2 };
    //res.render('index', foundpc );
    model.responseApi3(model.getPopular()) 
    .then(function(response) {
      
      var firstGame = response.shift();
      found = { game: response, firstGame: firstGame ,games:response2};
      //console.log(response2)
      res.render('index', found );
    });

  });

   

});





/* Retourne les résultats de la recherche à partir de la requête "query" */
app.get('/search', (req, res) => {
   
    var results
  

  console.log(req.query.query);
  model.responseApiSearchBar( req.query.query,model.GetGameList())
  .then(function(response) {
    var found={results : results=response}
    //console.log(response)
    res.render('search',found )
   
  });
  // Example usage
  
  //console.log(found)
 
  
});

app.get('/catalog/:tag/:plateform', (req, res) => {
   
    var results
  
  
  //console.log(toString(req.params.plateform));
  //console.log("Plateform: "+req.params.plateform);
  const plat=toString(req.params.plateform);
  //console.log(plat)

  model.responseApi2(model.GetGamesByTag(req.params.tag,req.params.plateform)) 
  .then(function(response) {
    
    var found={results : results=response}
    //console.log(response)
    res.render('catalog',found )
   
  }).catch(function(error) {
    console.error(error);
  });

  // Example usage
  
  //console.log(found)

 
  
});



app.get('/read/:id', (req, res) => {
  var entry;
  var results
  model.getGameDetails(req.params.id)
    .then(function(response) {
   
      const gameExistsPromise = model.checkIfGameIsInFavorites(req.session.userid, response.id);

      
      Promise.all([gameExistsPromise])
        .then(function([gameExists]) {

        
          entry = {results:response,gameExists: gameExists};

          console.log(entry)
          
          res.render('read', entry);
        })
    
       
    })
   
   
});

app.get('/catalogFlash',is_authenticated,(req,res) =>{
      var results;
      var data= model.getFlashGamesList()
      console.log(data);
      var entry = {results:results=data}
      res.render('catalogFlash',entry);
    
    //res.render('catalogFlash');
});

app.get('/play/:id',is_authenticated, (req, res) => {
  var entry;
  var data= model.getFlashGames(req.params.id)
  res.render('play',data);
});


app.get('/favorite',is_authenticated, (req, res) => {
  
  var data={results:model.getFavoriteGames(req.session.userid)}
  
  res.render('favorite',data);
});
  
app.get('/update/:id',is_authenticated, (req, res) => {
  var entry = model.read(req.params.id);

  res.render('update', entry);
});

app.get('/delete/:id', is_authenticated,(req, res) => {
  var entry = model.read(req.params.id);
  //res.render('delete',{name:  req.session.name });
  res.render('delete', {id: req.params.id, title: entry.title});
});


//formulaire login
app.get('/login', (req, res) => {
  res.render('login');
});
//fail one
app.get('/loginFail', (req, res) => {

  res.render('login',{fail:  'Wrong password or username' });
});


//page pour le forumulaire de new user
app.get('/new_user', (req, res) => {
  res.render('new_user');
});

//récupération des données 
app.post('/login', (req, res) => {
  const { name, password } = req.body;

  // Vérifier si les champs sont renseignés
  if (!name || !password) {
    return res.redirect('/login?error=missing');
  }
  let result =model.checkLoginInput(name,password)
  //console.log(result.id);
  if(result != null ){
    
    req.session.userid= result.id;
    req.session.name=result.name;
    //console.log( "USER ID"+req.session.userid)
    res.redirect('/');
  }else{
    res.redirect('/loginFail');
    //res.redirect('/login');
  }

  

});
//logOutPost
app.post('/logout', (req, res) => {
  req.session.userid = null; // Destroys the current session
  req.session.name='';
  res.redirect('/'); // Redirects the user to the homepage
});

app.get('/userexist', (req, res) => {

  res.render('new_user',{fail:  'Password or username are already used!' });
});
app.post('/new_user', (req, res) => {
  const { name, password } = req.body;

  let result = model.new_user(name, password);
  let check =model.checkLoginInput(name,password)
  if (result == 3) {
    return res.redirect('/userexist');
  } else if (result != null) {
    req.session.userid= check.id;
    req.session.name=check.name;
    return res.redirect('/');
  }
});
app.post('/showmore', (req, res) => {
  const {description,descontainer}= req.body;


  if (description.offsetHeight > descontainer.offsetHeight) {
  }

  
    if (description.classList.contains('expanded')) {
      description.classList.remove('expanded');
      readmore.innerHTML = 'Read more';
    } else {
      description.classList.add('expanded');
      readmore.innerHTML = 'Read less';
    }

   res.render('read');

});

app.post('/add_favorite', async (req, res) => {
  const { idgame, title, thumbnail, description } = req.body;
  console.log(idgame + title +thumbnail +description );
  try {
    const isAlreadyInFavorites = await model.checkIfGameIsInFavorites(req.session.userid, idgame);
    if (isAlreadyInFavorites) {
      console.log("Game already in favorites");
      //alert("game already in favorite");
    } else {
    
       model.addtofavorite(req.session.userid, idgame, thumbnail, description, title);
      console.log("Game added to favorites");
      
      //alert("game add to your favorite");
    }
  } catch (error) {
    console.log("Error adding game to favorites: ", error);
  }

  res.redirect('/read/' + idgame);
});

app.post('/deletefromfavorite', async(req,res)=>{
  const { idgame } = req.body;
  try{
    const isAlreadyInFavorites = await model.checkIfGameIsInFavorites(req.session.userid, idgame);
  if (isAlreadyInFavorites){
    model.deletefromfavorite(idgame);
  }
  else{
    console.log('Add this game to your favorites');
  }}
  catch(error) {
    console.log("Error", error);
  }
  res.redirect('/read/' + idgame);

});

//
/**** Routes pour modifier les données ****/

// Fonction qui facilite la création d'une recette



app.post('/update/:id', (req, res) => {
  var id = req.params.id;
  model.update(id, post_data_to_recipe(req));
  res.redirect('/read/' + id);
});

app.post('/delete/:id', (req, res) => {
  model.delete(req.params.id);
  res.redirect('/');            
});

/* fonction permettant de gérer la création d'un utilisateur */

app.listen(3000, () => console.log('listening on http://localhost:3000'));






 