const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware pour analyser les corps des requêtes en JSON
app.use(bodyParser.json());

// Configuration de la connexion à la base de données
const db = mysql.createConnection({
    host: '192.168.1.25',
    user: 'distantUser',
    password: 'azerty123',
    database: 'jo_favoris'
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MariaDB');
});

// Route pour vérifier le login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length === 0) {
            return res.status(401).send('Utilisateur non trouvé');
        }
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (isMatch) {
                res.send('Connexion réussie');
            } else {
                res.status(401).send('Mot de passe incorrect');
            }
        });
    });
});

// Route pour créer un utilisateur
app.post('/users', (req, res) => {
    const { nom, prenom, date_naissance, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send(err);
        }
        db.query(
            'INSERT INTO users (nom, prenom, date_naissance, email, password) VALUES (?, ?, ?, ?, ?)',
            [nom, prenom, date_naissance, email, hashedPassword],
            (err, results) => {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send('Utilisateur créé avec succès');
            }
        );
    });
});

// Route pour ajouter un favori
app.post('/favoris', (req, res) => {
    const { user_id, match_id } = req.body;
    db.query(
        'INSERT INTO favoris (user_id, match_id) VALUES (?, ?)',
        [user_id, match_id],
        (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.send('Favori ajouté avec succès');
        }
    );
});

// Route pour récupérer les utilisateurs
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Route pour récupérer un utilisateur par ID
app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results[0]);
    });
});

// Route pour récupérer les matchs
app.get('/matchs', (req, res) => {
    db.query('SELECT * FROM matchs', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Route pour récupérer un match par ID
app.get('/matchs/:id', (req, res) => {
    const matchId = req.params.id;
    db.query('SELECT * FROM matchs WHERE match_id = ?', [matchId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results[0]);
    });
});

// Route pour récupérer les équipes
app.get('/equipes', (req, res) => {
    db.query('SELECT * FROM equipes', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Route pour récupérer une équipe par ID
app.get('/equipes/:id', (req, res) => {
    const equipeId = req.params.id;
    db.query('SELECT * FROM equipes WHERE equipe_id = ?', [equipeId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results[0]);
    });
});

// Route pour récupérer les favoris d'un utilisateur par ID utilisateur
app.get('/favoris/user/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM favoris WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Route pour récupérer les épreuves
app.get('/epreuves', (req, res) => {
    db.query('SELECT * FROM epreuves', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Route pour récupérer une épreuve par ID
app.get('/epreuves/:id', (req, res) => {
    const epreuveId = req.params.id;
    db.query('SELECT * FROM epreuves WHERE epreuve_id = ?', [epreuveId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results[0]);
    });
});

app.listen(port, () => {
    console.log(`Serveur API démarré sur http://localhost:${port}`);
});
