import express from 'express'
import mongoose from 'mongoose'
import Grid from 'gridfs-stream'

const app = express()

mongoose.connect('mongodb://127.0.0.1:27017/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const conn = mongoose.connection

let gfs
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo)
  gfs.collection('uploads') // Replace 'uploads' with your GridFS bucket name
})

app.get('/download/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({ err: 'File not found' })
    }

    res.set('Content-Type', file.contentType)
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`)

    const readstream = gfs.createReadStream(file.filename)
    readstream.pipe(res)
  })
})

app.listen(3000)
