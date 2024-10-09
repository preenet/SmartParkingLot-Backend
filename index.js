const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase, queryDataAndExportToCSV } = require('./services/dataService');
const authRoutes = require('./routes/authRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const provinceRoutes = require('./routes/provinceRoutes');
const historyRoutes = require('./routes/historyRoutes');
const detectionRoutes = require('./routes/detectionRoutes');

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors({
  credentials: true,
  origin: ["http://localhost:5173"],
}));


app.use('/api', authRoutes);
app.use('/api', licenseRoutes);
app.use('/api', provinceRoutes);
app.use('/api', historyRoutes);
app.use('/api', detectionRoutes);

cron.schedule('* * * * *', async () => {
  console.log('Running cron job to recreate and upload CSV');
  await queryDataAndExportToCSV();
});

app.listen(port, async () => {
  try {
    await initDatabase();
    console.log(`Server started at port ${port}`);
    await queryDataAndExportToCSV();
  } catch (error) {
    console.error("Error initializing MySQL connection:", error);
    process.exit(1);
  }
});
