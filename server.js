const express = require('express');
const dotenv = require('dotenv');
const chatRoutes = require('./routes/chatRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.use('/api/chat', chatRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
