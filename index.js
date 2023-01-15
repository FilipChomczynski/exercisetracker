const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, function () {
	console.log('[DB] Connected');
});

const userSchema = new mongoose.Schema({
	username: String,
});
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
	username: String,
	description: String,
	duration: Number,
	date: Date,
	userId: String,
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async function (req, res) {
	const username = req.body.username;
	const user = await User.create({ username });
	res.json(user);
});

app.get('/api/users', async function (req, res) {
	const users = await User.find();
	res.json(users);
});

app.post('/api/users/:_id/exercises', async function (req, res) {
	const id = req.params._id;
	const body = req.body;
	const user = await User.findById(id);

	if (!body.date) {
		body.date = new Date();
	}

	await Exercise.create({
		username: user.username,
		description: body.description,
		duration: body.duration,
		date: body.date,
		userId: user.id,
	});

	const exercises = await Exercise.find({ username: user.username });

	res.json({ user: user.toJSON(), exercises: exercises });
});

app.get('/api/users/:_id/logs', async function (req, res) {
	const userId = req.params._id;
	const user = await User.findById(userId);

	let { from, to, limit } = req.query;
	let filter = { userId };
	let dateFilter = {};

	if (from) {
		dateFilter['$gte'] = new Date(from);
	}
	if (to) {
		dateFilter['$lte'] = new Date(to);
	}
	if (from || to) {
		filter.date = dateFilter;
	}

	if (!limit) {
		limit = Number.MAX_SAFE_INTEGER;
	}
	console.log(filter);
	let exercises = await Exercise.find(filter).limit(limit);
	exercises = exercises.map(e => {
		return {
			description: e.description,
			duration: e.duration,
			date: e.date.toDateString(),
		};
	});

	res.json({
		username: user.username,
		_id: userId,
		count: exercises.length,
		log: exercises,
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
