const express = require('express');  //imports the Express framework for creating the web server
const bodyParser = require('body-parser'); //imports the body-parser middleware to parse incoming request bodies
const sqlite3 = require('sqlite3').verbose(); //imports the SQLite3 library and enables verbose mode for detailed logging
const app = express(); //creates an instance of an Express application
const port = 3000; //defines the port number the server will listen on

//sets up the SQLite database
global.db = new sqlite3.Database('./database.db', function(err) {
    if (err) {
        console.error(err); //logs error to the console
        process.exit(1); //exits if database connection fails
    } else {
        console.log("Database connected"); //logs message to the console
        global.db.run("PRAGMA foreign_keys=ON"); //enables foreign key constraints
    }
});

//middleware to fetch and distribute settings from the settings table in the database
app.use((req, res, next) => {
    db.all('SELECT id, value FROM Settings WHERE id IN ("title", "subtitle", "author")', (err, rows) => {
        if (err) {
            return next(err); //pass errors to Express error handler
        }
        rows.forEach(row => {
            res.locals[row.id] = row.value; //stores settings in res.locals for access in templates
        });
        next(); //moves to the next middleware or route handler
    });
});

//body parser middleware to handle the form data
app.use(bodyParser.urlencoded({ extended: true }));

//sets the view engine and static folder
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

//routes
const authorsRoutes = require('./routes/authors');
const readersRoutes = require('./routes/readers');

//mounts the authors and readers routes
app.use('/authors', authorsRoutes); //mounts authors routes
app.use('/readers', readersRoutes); //mounts readers routes

//main homepage route
app.get('/', (req, res) => {
    //renders the home view with blog settings from res.local
    res.render('home', {
        blogTitle: res.locals.title,
        blogSubtitle: res.locals.subtitle,
        authorName: res.locals.author
    });
});

//starts the server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});