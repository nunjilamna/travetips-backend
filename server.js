const express = require('express');
const app = express();
const tipsRoutes = require('./tips');
const multer = require('multer');

// Middleware untuk membaca body dalam format JSON
app.use(express.json());

// Gunakan routes untuk endpoint tips
app.use(tipsRoutes);

app.get("/", (req, res) => {
    console.log("Response success")
    res.send("Response Success!")
})
// Jalankan server pada port tertentu
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
