const express = require('express'); //imports the express framework
const router = express.Router(); //creates a new router instance 
const sqlite3 = require('sqlite3').verbose(); //imports the SQLite3 module

//sets up the SQLite database connection
const db = new sqlite3.Database('./database.db');

//middleware to provide blog settings to views
router.use((req, res, next) => {
    //uses shared settings for rendering views
    res.locals.blogTitle = res.locals.title; //blog title
    res.locals.blogSubtitle = res.locals.subtitle; //blog subtitle
    res.locals.authorName = res.locals.author; //author name
    next(); //moves to the next middleware or route handler
});

//function to format timestamp to desired format (dd/mm/yy hh:mm:ss)
function formatTimestamp(timestamp) {
    const date = new Date(timestamp); //converts timestamp to date object
    const day = date.getDate().toString().padStart(2, '0'); //gets date and format as 2 digits
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // gets month and format as 2 digits
    const year = date.getFullYear().toString().slice(-2); //gets year and format as 2 digits
    const hours = date.getHours().toString().padStart(2, '0'); //gets hours and format as 2 digits
    const minutes = date.getMinutes().toString().padStart(2, '0'); //gets minutes and format as 2 digits
    const seconds = date.getSeconds().toString().padStart(2, '0'); //gets seconds and format as 2 digits
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`; //returns the formated timestamp
}

//GET request to render reader home page
router.get('/', (req, res) => {

    //purpose: retrieves and displays the list of published articles, sorted by the specified criteria
    //inputs: sort-by comments data from query
    //outputs: renders the 'reader-home' view with the sorted list of articles and sorting criteria

    //gets the 'sortBy' parameter from the query string or default to 'publishedAt'
    const sortBy = req.query.sortBy || 'publishedAt'; 

    //contructs the SQL query based on the 'soryBy' parameter 
    db.all('SELECT * FROM published_articles ORDER BY ' + 
        //determines the order clause based on the 'sortBy' value 
        (sortBy === 'likes' ? 'likes DESC' : 
        sortBy === 'reads' ? 'reads DESC' : 
        sortBy === 'title' ? 'title ASC' : 
        'publishedAt DESC'), 
        (err, publishedArticles) => {
        //handles any error occured during database query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to load published articles');
            //exits the function
            return;
        }

        //format timestamps for display in the published articles
        publishedArticles.forEach(article => {
            article.publishedAt = formatTimestamp(article.publishedAt);
        });

        //renders the reader-home view with the sorted articles and parameters stated
        res.render('reader-home', {
            blogTitle: res.locals.title,
            authorName: res.locals.author,
            publishedArticles: publishedArticles,
            sortBy: sortBy 
        });
    });
});

//GET request to render 'reader-article' page
router.get('/article/:id', (req, res) => {

    //purpose: retrieves and displays a specific article along with its comments and replies
    //inputs: articleId from URL params and sort-by comments data from query
    //outputs: renders the 'reader-article' view with the article, comments, and sorting criteria

    //retrieves the article ID from the route parameters
    const articleId = req.params.id;
    //gets the 'sortBy' parameter from the query string or defaults to 'publishedAt'
    const sortBy = req.query.sortBy || 'publishedAt';

    //fetches the article details from the database
    db.get('SELECT * FROM published_articles WHERE id = ?', [articleId], (err, article) => {
        //checks if there was an error executing the query
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to load article');
            //exits the function
            return;
        }
         //checks if the article was not found
        if (!article) {
            //sends a HTTP response
            res.status(404).send('Article not found');
            //exits the function
            return;
        }

        //increments the views count for the article
        const newReadsCount = article.reads + 1;
        db.run('UPDATE published_articles SET reads = ? WHERE id = ?', [newReadsCount, articleId], (err) => {
            //checks if there was an error executing the query
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to update views count');
                //exits the function
                return;
            }

            //fetches the updated article from the database
            db.get('SELECT * FROM published_articles WHERE id = ?', [articleId], (err, updatedArticle) => {
                //checks if there was an error executing the query
                if (err) {
                    //logs an error to the console
                    console.error(err);
                    //sends a HTTP response
                    res.status(500).send('Failed to load updated article');
                    //exits the function
                    return;
                }
                //checks if the updated article was no found
                if (!updatedArticle) {
                    //sends a HTTP response
                    res.status(404).send('Updated article not found');
                    //exits the function
                    return;
                }
                //formats the published date of the updated article
                updatedArticle.publishedAt = formatTimestamp(updatedArticle.publishedAt);

                //determines the order for comments

                //sets the default sorting order for comments to be by created date in descending order
                let orderBy = 'createdAt DESC';
                //checks if the sortBy parameter is 'name' and updates the sorting order to be by commenter name in ascending order
                if (sortBy === 'name') {
                    orderBy = 'commenterName ASC';
                } 
                //checks if the sortBy parameter is 'publishedDate' and updates the sorting order by created date in descending order
                else if (sortBy === 'publishedDate') {
                    orderBy = 'createdAt DESC';
                } 
                //checks if the sortBy parameter is 'createdDate' and updates the sorting order by created date in ascending order
                else if (sortBy === 'createdDate') {
                    orderBy = 'createdAt ASC';
                }

                //fetches the comments and their replies for the articles 
                const commentsQuery = `SELECT * FROM comments WHERE articleId = ? AND parent_comment_id IS NULL ORDER BY ${orderBy}`;
                db.all(commentsQuery, [articleId], (err, comments) => {
                    //checks if there was an error executing the query
                    if (err) {
                        //logs an error to the console
                        console.error(err);
                        //sends a HTTP response
                        res.status(500).send('Failed to load comments');
                        //exits the function
                        return;
                    }

                    //fetches the replies for the article
                    const repliesQuery = 'SELECT * FROM comments WHERE parent_comment_id IS NOT NULL AND articleId = ?';
                    db.all(repliesQuery, [articleId], (err, replies) => {
                        //checks if there was an error executing the query
                        if (err) {
                            //logs an error to the console
                            console.error(err);
                            //sends a HTTP response
                            res.status(500).send('Failed to load replies');
                            //exits the function
                            return;
                        }

                        //formats the creation timestamps for each comment
                        comments.forEach(comment => {
                            comment.createdAt = formatTimestamp(comment.createdAt);
                            //associates each comment with its replies
                            comment.replies = replies.filter(reply => reply.parent_comment_id === comment.id);
                        });

                        //formats the creation timestamps for each reply
                        replies.forEach(reply => {
                            reply.createdAt = formatTimestamp(reply.createdAt);
                        });

                        //renders the reader-article view with the article, comments, and sort criteria
                        res.render('reader-article', {
                            blogTitle: res.locals.title,
                            authorName: res.locals.author,
                            article: updatedArticle,
                            comments: comments,
                            sortBy: sortBy
                        });
                    });
                });
            });
        });
    });
});


//POST request to increment likes count for an article
router.post('/article/:id/increment-likes', (req, res) => {

    //purpose: increments the likes count for a specific article
    //inputs: articleId from URL params
    //outputs: sends a JSON response with the updated likes count
   
    //retreives the article ID from the URL parameters
    const articleId = req.params.id;

    //updates the likes count in the database
    //by incrementing it by 1 for the specified article ID
    db.run('UPDATE published_articles SET likes = likes + 1 WHERE id = ?', [articleId], function(err) {
        //handles any errors that occurs during the update
        if (err) {
            //logs an error to the console
            console.error(err);
            //sends a HTTP response
            res.status(500).send('Failed to increment likes');
            //exits the function
            return;
        }
        //retrieves the updated likes count for the article 
        db.get('SELECT likes FROM published_articles WHERE id = ?', [articleId], (err, row) => {
            //handles any errors that occurs during the article retreival 
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to retrieve likes count');
                //exits the function
                return;
            }
            //sends a JSON response with the updated likes count
            res.json({ likes: row.likes }); 
        });
    });
});

//POST request to submit a comment for an article
router.post('/article/:id/comment', (req, res) => {

    //purpose: submits a comment for a specific article
    //inputs: articleId from URL params and comments data from request body
    //'commentContent', and 'avatar'), res (the Express response object)
    //outputs: sends an HTTP response indicating success or failure of the comment submission
   
    //retreives the article ID from the URL parameters
    const articleId = req.params.id;
    //extracts the commentor name, commentor content and avatar from the request body 
    const { commenterName, commentContent, avatar } = req.body;

    //checks if all required fields are provided 
    if (!commenterName || !commentContent || !avatar) {
        res.status(400).send('Commenter name, content, and avatar are required');
        return;
    }

    //gets the current date and time in ISO format
    const createdAt = new Date().toISOString();
    //inserts a new comment into the database
    db.run('INSERT INTO comments (articleId, commenterName, commentContent, avatar, createdAt) VALUES (?, ?, ?, ?, ?)',
        [articleId, commenterName, commentContent, avatar, createdAt],
        (err) => {
            //handles any errors that occurs during the insertion
            if (err) {
                //logs an error to the console
                console.error(err);
                //sends a HTTP response
                res.status(500).send('Failed to add comment');
                //exits the function
                return;
            }
            //redirects the user back the article page after successfully adding the comment
            res.redirect(`/readers/article/${articleId}`);
        });
});


module.exports = router;