require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const urlParser = require('url')
const dns = require('dns')
const Schema = mongoose.Schema

// Basic Configuration

const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({extended:false}))

const URL_SCHEMA = new Schema({
  original_url: {type:String, unique: true},
})

var urlModel = mongoose.model('urlModel', URL_SCHEMA)

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res)=>{
   const urlValid = dns.lookup(urlParser.parse(req.body.url).hostname, (err, doc)=>{
    if(!doc){
      res.json({error: 'Invalid url'})
    }
    else{
      urlModel.exists({original_url: req.body.url}, (err, doc)=>{
        if(doc) {
          return res.json({error: 'original URL already exist in database', short_url: doc._id})
        }
      })
      const MY_URL = new urlModel({original_url: req.body.url})
      MY_URL.save((err,doc)=>{
        if(err) return 
        else{
          res.json({
            original_url: doc.original_url,
            short_url: doc.id
          })
        }
      })
    }
  })
})

app.get('/api/shorturl/:id', (req,res)=>{
  const id = req.params.id
  urlModel.findById(id, (err,doc)=>{
    if(err) console.log(err)
    if(!doc){
      res.json({error: 'Invalid id'})
    }
    else{
      res.redirect(doc.original_url)
    }
  })
})



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
