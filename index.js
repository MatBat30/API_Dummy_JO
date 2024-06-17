const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors({ origin: '*' }));

const port = 3000;

app.use(bodyParser.json());

function formatDates(obj) {
    for (const key in obj) {
        if (obj[key] instanceof Date) {
            obj[key] = obj[key].toISOString().split('T')[0];
        }
    }
    return obj;
}

// Configuration de la connexion à la base de données
const db = mysql.createConnection({
    host: 'bdd.0shura.fr',
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

// Configuration Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API JO 2021',
            version: '1.0.0',
            description: 'Une API pour gérer les utilisateurs et leurs favoris pour JO 2021',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
    },

    apis: ['./index.js'], // chemin vers les annotations dans votre fichier
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Vérifier le statut du serveur
 *     responses:
 *       200:
 *         description: Serveur en fonctionnement
 */
app.get('/', (req, res) => {
    res.send('Serveur API JO 2024 is up and running!');
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Vérifier le login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: integer
 *                     nom:
 *                       type: string
 *                     prenom:
 *                       type: string
 *                     date_naissance:
 *                       type: string
 *                       format: date
 *                     email:
 *                       type: string
 *       401:
 *         description: Utilisateur non trouvé ou mot de passe incorrect
 */
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
                res.json({
                    message: 'Connexion réussie',
                    user: formatDates({
                        user_id: user.user_id,
                        nom: user.nom,
                        prenom: user.prenom,
                        date_naissance: user.date_naissance,
                        email: user.email,
                    })
                });
            } else {
                res.status(401).send('Mot de passe incorrect');
            }
        });
    });
});

/**
 * @swagger
 * /create-user:
 *   post:
 *     summary: Créer un utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               date_naissance:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 nom:
 *                   type: string
 *                 prenom:
 *                   type: string
 *                 date_naissance:
 *                   type: string
 *                   format: date
 *                 email:
 *                   type: string
 */
app.post('/create-user', (req, res) => {
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
                    console.log(err);
                    return res.status(500).send(err);
                }
                db.query('SELECT * FROM users WHERE user_id = ?', [results.insertId], (err, userResults) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.status(201).json(formatDates(userResults[0]));
                });
            }
        );
    });
});

/**
 * @swagger
 * /create-users:
 *   post:
 *     summary: Créer plusieurs utilisateurs
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 nom:
 *                   type: string
 *                 prenom:
 *                   type: string
 *                 date_naissance:
 *                   type: string
 *                   format: date
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *     responses:
 *       201:
 *         description: Utilisateurs créés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   prenom:
 *                     type: string
 *                   date_naissance:
 *                     type: string
 *                     format: date
 *                   email:
 *                     type: string
 */
app.post('/create-users', (req, res) => {
    const users = req.body;
    const values = users.map(user => [
        user.nom,
        user.prenom,
        user.date_naissance,
        user.email,
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?)').join(', ');

    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return res.status(500).send(err);
        }
        const hashedValues = values.map(user => {
            const hashedPassword = bcrypt.hashSync(user[4], salt);
            return [user[0], user[1], user[2], user[3], hashedPassword];
        });

        const sql = `INSERT INTO users (nom, prenom, date_naissance, email, password) VALUES ${placeholders}`;
        db.query(sql, [].concat(...hashedValues), (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            const userIds = Array.from({ length: users.length }, (_, i) => results.insertId + i);
            db.query('SELECT * FROM users WHERE user_id IN (?)', [userIds], (err, userResults) => {
                if (err) {
                    return res.status(500).send(err);
                }
                res.status(201).json(userResults.map(formatDates));
            });
        });
    });
});

/**
 * @swagger
 * /add-favori:
 *   post:
 *     summary: Ajouter un favori
 *     tags: [Favoris]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               match_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Favori ajouté avec succès
 */
app.post('/add-favori', (req, res) => {
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

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   prenom:
 *                     type: string
 *                   date_naissance:
 *                     type: string
 *                     format: date
 *                   email:
 *                     type: string
 */
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results.map(formatDates));
    });
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 nom:
 *                   type: string
 *                 prenom:
 *                   type: string
 *                 date_naissance:
 *                   type: string
 *                   format: date
 *                 email:
 *                   type: string
 */
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(formatDates(results[0]));
    });
});

/**
 * @swagger
 * /matchs:
 *   get:
 *     summary: Récupérer tous les matchs
 *     tags: [Matchs]
 *     responses:
 *       200:
 *         description: Liste des matchs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   match_id:
 *                     type: integer
 *                   date:
 *                     type: string
 *                     format: date
 *                   equipe1:
 *                     type: string
 *                   equipe2:
 *                     type: string
 */
app.get('/matchs', (req, res) => {
    db.query('SELECT * FROM matchs', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results.map(formatDates));
    });
});

/**
 * @swagger
 * /match/{id}:
 *   get:
 *     summary: Récupérer un match par ID
 *     tags: [Matchs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du match
 *     responses:
 *       200:
 *         description: Détails du match
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 match_id:
 *                   type: integer
 *                 date:
 *                   type: string
 *                   format: date
 *                 equipe1:
 *                   type: string
 *                 equipe2:
 *                   type: string
 */
app.get('/match/:id', (req, res) => {
    const matchId = req.params.id;
    db.query('SELECT * FROM matchs WHERE match_id = ?', [matchId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(formatDates(results[0]));
    });
});

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: Récupérer toutes les équipes
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Liste des équipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   equipe_id:
 *                     type: integer
 *                   nom:
 *                     type: string
 */
app.get('/teams', (req, res) => {
    db.query('SELECT * FROM equipes', (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results.map(formatDates));
    });
});

/**
 * @swagger
 * /team/{id}:
 *   get:
 *     summary: Récupérer une équipe par ID
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'équipe
 *     responses:
 *       200:
 *         description: Détails de l'équipe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 equipe_id:
 *                   type: integer
 *                 nom:
 *                   type: string
 */
app.get('/team/:id', (req, res) => {
    const equipeId = req.params.id;
    db.query('SELECT * FROM equipes WHERE equipe_id = ?', [equipeId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(formatDates(results[0]));
    });
});

/**
 * @swagger
 * /favoris/user/{id}:
 *   get:
 *     summary: Récupérer les favoris d'un utilisateur par ID utilisateur
 *     tags: [Favoris]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des favoris
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   favori_id:
 *                     type: integer
 *                   user_id:
 *                     type: integer
 *                   match_id:
 *                     type: integer
 */
app.get('/favoris/user/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM favoris WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results.map(formatDates));
    });
});

/**
 * @swagger
 * /epreuves:
 *   get:
 *     summary: Récupérer toutes les épreuves
 *     tags: [Epreuves]
 *     responses:
 *       200:
 *         description: Liste des épreuves
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   epreuve_id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 */
app.get('/epreuves', (req, res) => {
    db.query('SELECT * FROM epreuves', (err, results) => {
        if (err) {
            return res.status(500).send (err);
        }
            res.json(results.map(formatDates));
        });
    });

    /**
     * @swagger
     * /epreuve/{id}:
     *   get:
     *     summary: Récupérer une épreuve par ID
     *     tags: [Epreuves]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID de l'épreuve
     *     responses:
     *       200:
     *         description: Détails de l'épreuve
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 epreuve_id:
     *                   type: integer
     *                 nom:
     *                   type: string
     *                 date:
     *                   type: string
     *                   format: date
     */
    app.get('/epreuve/:id', (req, res) => {
        const epreuveId = req.params.id;
        db.query('SELECT * FROM epreuves WHERE epreuve_id = ?', [epreuveId], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.json(formatDates(results[0]));
        });
    });

    /**
     * @swagger
     * /update-user/{id}:
     *   put:
     *     summary: Mettre à jour un utilisateur
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID de l'utilisateur
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nom:
     *                 type: string
     *               prenom:
     *                 type: string
     *               date_naissance:
     *                 type: string
     *                 format: date
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: Utilisateur mis à jour
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 user_id:
     *                   type: integer
     *                 nom:
     *                   type: string
     *                 prenom:
     *                   type: string
     *                 date_naissance:
     *                   type: string
     *                   format: date
     *                 email:
     *                   type: string
     */
    app.put('/update-user/:id', (req, res) => {
        const userId = req.params.id;
        const { nom, prenom, date_naissance, email } = req.body;
        db.query(
            'UPDATE users SET nom = ?, prenom = ?, date_naissance = ?, email = ? WHERE user_id = ?',
            [nom, prenom, date_naissance, email, userId],
            (err, results) => {
                if (err) {
                    return res.status(500).send(err);
                }
                db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, userResults) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.json(formatDates(userResults[0]));
                });
            }
        );
    });

    /**
     * @swagger
     * /delete-user/{id}:
     *   delete:
     *     summary: Supprimer un utilisateur
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID de l'utilisateur
     *     responses:
     *       200:
     *         description: Utilisateur supprimé avec succès
     */
    app.delete('/delete-user/:id', (req, res) => {
        const userId = req.params.id;
        db.query('DELETE FROM users WHERE user_id = ?', [userId], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.send('Utilisateur supprimé avec succès');
        });
    });

    /**
     * @swagger
     * /delete-favori/{id}:
     *   delete:
     *     summary: Supprimer un favori
     *     tags: [Favoris]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID du favori
     *     responses:
     *       200:
     *         description: Favori supprimé avec succès
     */
    app.delete('/delete-favori/:id', (req, res) => {
        const favoriId = req.params.id;
        db.query('DELETE FROM favoris WHERE favori_id = ?', [favoriId], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.send('Favori supprimé avec succès');
        });
    });

    /**
     * @swagger
     * /update-user/{id}/change-password:
     *   put:
     *     summary: Changer le mot de passe d'un utilisateur
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: ID de l'utilisateur
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               newPassword:
     *                 type: string
     *     responses:
     *       200:
     *         description: Mot de passe mis à jour avec succès
     */
    app.put('/update-user/:id/change-password', (req, res) => {
        const userId = req.params.id;
        const { newPassword } = req.body;
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).send(err);
            }
            db.query(
                'UPDATE users SET password = ? WHERE user_id = ?',
                [hashedPassword, userId],
                (err, results) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    res.send('Mot de passe mis à jour avec succès');
                }
            );
        });
    });

    app.listen(port, () => {
        console.log(`Serveur API démarré sur http://localhost:${port} ou sur https://jo.0shura.fr/`);

    });
