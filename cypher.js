const express = require('express');
const app = express();
var fs = require('fs');

var multer = require('multer');
var upload = multer({ dest: 'uploads/' });
//var formidable = require('formidable');

// Sort object from most to least
function sortAssocObject(list) {
    var sortable = [];
    for (var key in list) {
        sortable.push([key, list[key]]);
    }

    sortable.sort(function(a, b) {
        return (a[1] < b[1] ? 1 : (a[1] > b[1] ? -1 : 0));
    });

    var orderedList = {};
    for (var i = 0; i < sortable.length; i++) {
        orderedList[sortable[i][0]] = sortable[i][1];
    }

    return orderedList;
}

// Function that will generate all 4 letter combinations from each line
// ej.  Hello World
// This would generate the following quads:
// hell, ello, llow, lowo, owor, worl, orld
// each quad is put in an array and counted how many time it appears in
// the text
function getQuadrants(filename, cb)
{
			var tmpquadrants = [];
			var mylines =0;

			var fs = require('fs');
			var readline = require('readline');
			var stream = require('stream');

			var instream = fs.createReadStream(filename);
			var outstream = new stream;
			var rl = readline.createInterface(instream, outstream);

      rl.on('line', function (line) {
				mylines +=1;
        myline = line.toLowerCase().replace(/[^a-z]/g, '');
        for (var i=0; i<=(myline.length-4); i++) {
          newquad=myline.substr(i, 4);
          if(typeof tmpquadrants["'"+newquad+"'"] === 'undefined') {
              // does not exist
              tmpquadrants["'"+newquad+"'"] = 1;
          }
          else {
              // does exist
              tmpquadrants["'"+newquad+"'"] += 1;
          }
        }
      });

      rl.on('close', function () {
				// Sort quads from most to least.
				var quadrants=sortAssocObject(tmpquadrants);
				return cb(null, quadrants);
      });
}

// This function will give the score of the quad.
// If it is found, then the number of times that quad appeared
// in the plain file will be it score, divided by the total of
// quads and then log10 applied to it.
// If not found, then minimal score of 0.001 is given.
function quad_fitness(lookfor, totQuads, quadrants)
{
	var conteo = 0;
	if (typeof quadrants["'"+lookfor+"'"] === 'undefined') {
		conteo = 0.001;
  }
  else {
		conteo = quadrants["'"+lookfor+"'"];
  }
  return Math.log10(conteo/totQuads);
}

// This function will calculate the score of the translated text.
// It will compare quad's (4 letters) against our previously generated
// quads from our plain file. The more quads it finds, the higher the
// score.
function line_fitness(txt, totQuads, quadrants)
{
  var fitness=0;
  for (var i=0; i<=(txt.length - 4); i++)
  {
    var newquad = txt.substr(i, 4);
//    console.log('Quad: '+newquad+' score: '+result+" quadrant: "+ quadrants["'"+newquad+"'"]);
    fitness += quad_fitness(newquad, totQuads, quadrants);
  }
  return fitness;
}

// This function will decypher the text given with the key given,
// It will return the decyphered text. Punctuations are not taken
// into account, they are just 'skipped'
function decypher(txt, key)
{
	var txtDecyphered = txt;
  var letters = "abcdefghijklmnopqrstuvwxyz";
  if (txt.length > 0)
  {
		for (var i = 0, len = txt.length; i < len; i++) {
  			var search_char = txt[i].toLowerCase();
				if (letters.indexOf(search_char) >= 0) {
					var find_pos=key.indexOf(search_char);
					if (search_char == txt[i]) {
						txtDecyphered = setCharAt(txtDecyphered, i, letters[find_pos]);
					}
					else {
						txtDecyphered = setCharAt(txtDecyphered, i, letters[find_pos].toUpperCase());
					}
				}
		}
  }
  return txtDecyphered;
}

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

function getScore(txt, key, totQuads, quadrants) {
  score=0;
  for (var i=0; i<txt.length; i++) {
    //decypher text with child key
    deciphered = decypher(txt[i], key);
    // score result of deciphered text with child key
    score += line_fitness(deciphered, totQuads, quadrants);
  }
//  console.log("key : "+key+" score: "+score);
  return score;

}


String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}


// This function will iterate the basekey, score it and then make
// changes on it, score it again, and if the score is better, it
// will change the new key as the current best key; and so on,
// until no more better score can be found. It is limited to
// 1,000 cycles.
function generateBestKey(file_encrypted, basekey, quadrants, cb)
{
	  var maxscore = -1000000000;
	  var donekeys=[];
    var txt=[];
	  var lines=0;
    var keystried=[];

	 var totQuads = 0;
   var conteo =0;
	 for (var quad in quadrants) {
	//	 console.log('quad: ', quad, ' value: ',quadrants[quad], 'totQuads: ',totQuads)
	   totQuads += quadrants[quad];
	 }

  // get only 100 lines of the encrypted file.
  var fs = require('fs'),
      readline = require('readline'),
      instream = fs.createReadStream(file_encrypted),
      outstream = new (require('stream'))(),
      rl = readline.createInterface(instream, outstream);

  rl.on('line', function (line) {
    lineread=line.toLowerCase().replace(/[^a-z]/g, '');
    if (lineread) {
      txt[lines] = lineread;
      lines++;
    }
    if (lines > 150) rl.close();
  });

  rl.on('close', function (line) {
    childs=0;
    console.log('Tot Quads: '+totQuads);
		// now we can process
		// we shall try first decypher with basekey.
//		deciphered = decypher(txt, basekey);
//    basekey='zhimneyxwvutsrqpolkjgfdcba';
    console.log('Parentscore');

    maxkey= parentkey = basekey;
    while (true) {
      parentkey.shuffle();
      // now get score for this decyphered text
  //	  parentscore = line_fitness(deciphered, totQuads, quadrants);
      parentscore = getScore(txt, parentkey, totQuads, quadrants);
      donekeys[parentkey]=1;
  	  var count = 0;
  	  while (count < 1000)
  	  {
          ++conteo;
          var child = parentkey;
          while (typeof donekeys[child] !== 'undefined')  {
            // generate two numbers between 0-25 (the alphabet)
    				// we will use these as positions to swap to try to
    				// generate a better key
            var a = Math.floor(Math.random() * 26) + 0;
    				var b = Math.floor(Math.random() * 26) + 0;
    	      // swap two characters in the child
    				var tmp = child.charAt(a);
    				child = setCharAt(child, a, child.charAt(b));
    				child = setCharAt(child, b, tmp);

            ++childs;
          }

          donekeys[child]=1;

  				//decypher text with child key
  //	      deciphered = decypher(txt, child);
  				// score result of deciphered text with child key
  //	      score = line_fitness(deciphered, totQuads, quadrants);
  //        console.log(child, score);
          score = getScore(txt, child, totQuads, quadrants);

  	      // if the child score was better, replace the parent with it
  	      if (score > parentscore)
  	      {
  	          parentscore = score;
  	          parentkey = child;
  	          count = 0;
//              console.log(' k: '+child+'    score : '+score);
  	      }
          count += 1;
        }

        if (parentscore > maxscore) {
            maxscore = parentscore;
            maxkey = parentkey;
            console.log('best score so far: '+maxscore+' on iteration '+conteo+" childs: "+childs);
            console.log('    best key: '+maxkey);
        }
        if (conteo > 10000) break;
	    }
      console.log('Conteo fue: '+conteo)
      console.log('Key: '+maxkey)
//			deciphered = decypher(txt, basekey);
//      decypher(line, basekey, function(err, deciphered) {
//        if (err) throw err;
//      });
			return cb(null, maxkey);
  });
}

// This function will decypher a file and write de new text to a new file
// that will have the cypherkey +.txt as name,
// we shall use magic key cypher key
function decypherTheFile(file_to_decypher, cypherkey)
{
		var fs = require('fs');

		// open file to write decyphered text
		var file = fs.createWriteStream('results/'+cypherkey+'.txt');
		file.on('error', function(err) {
			console.log(err);
			console.log('Error opening file to fill with decyphered info');
			process.exit();
		});

		// open file to decypher
		var readline = require('readline'),
	      instream = fs.createReadStream(file_to_decypher),
	      outstream = new (require('stream'))(),
	      rl = readline.createInterface(instream, outstream);

	  rl.on('line', function (line) {
			// now we decypher per line with our magic key
			deciphered = decypher(line, cypherkey);
			// write to a file the decyphered line (add new line for readability).
      file.write(deciphered+'\n');
	  });
		rl.on('close', function (line) {
			file.end();
		});
}

// Query to get the book with isbn
function decypherFile(file_to_decypher, plain_file, cb)
{
  // we anaylize the plaing file to get all the quads (4 letter combinations)
  getQuadrants(plain_file, function(err, quadrants){
		if (err) throw err;
//		console.log('Quadrants generated: ', quadrants);

    // we will use as inicial key, the alphabet but reversed.
//		var basekey="abcdefghijklmnopqrstuvwxyz".split("").reverse().join("");
    var basekey="etoahsinrldumywfcgbpvkxjqz";
		// with basekey as the basic key, we will improve it until we can get
	  // the best key possible to decypher file
	  generateBestKey(file_to_decypher, basekey, quadrants,
		   function(err, bestKey) {
				 if (err) throw err;
				 console.log('The Best Key is : ', bestKey);

				 // now we can decypher the encoded text
			   var decypherd_results = decypherTheFile(file_to_decypher, bestKey);

				 cb(null, bestKey);
			 });
	});
}


var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 3000;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    console.log('Something is happening.');
//    console.log(req);
    console.log(req.method);
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/cypher')

    .post(upload.any(2), function(req, res, next) {
//       console.log(req.files, 'files');
       var encrypted = req.files[0].originalname;
       console.log('File encryted name: '+encrypted);
       var plain = req.files[1].originalname;
       console.log('File plain name: '+plain);
       // now we process the files

       decypherFile(encrypted, plain, function(err, decyphered) {
         if (err) throw err;
         // return decyphered key to client
          res.json({Key: decyphered});
          console.log('Sent !', decyphered+'.txt');
       })

    })

    router.route('/cypher/:decipheredfile')

    .get(function(req, res, next) {
          console.log(req.body, 'Body');
          console.log(req.params, 'Params');
          filetosend=req.params.decipheredfile;
//          console.log(req.files, 'files');
//          res.setHeader('Content-Type', 'text/json');
          console.log(filetosend);
          res.download(__dirname+"/results/"+filetosend, filetosend);
//          res.status(200).end();
          console.log('Sent !');
    });


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
      fs.readFile(__dirname + '/public/index.html', 'utf8', function(err, text){
          res.send(text);
      });
//      res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use(express.static(__dirname + '/public'));


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
