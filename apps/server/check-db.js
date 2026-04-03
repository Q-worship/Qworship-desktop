const mongoose = require('mongoose');

// Just connect directly to the dev DB instance, adjust URL if needed
mongoose.connect('mongodb://localhost:27017/qworship'); 

mongoose.connection.once('connected', async () => {
  try {
    const coll = mongoose.connection.collection('presentations');
    const docs = await coll.find({}).toArray();
    console.log("Total presentations:", docs.length);
    if(docs.length > 0) {
       console.log("Sample sections type:", typeof docs[0].sections, Array.isArray(docs[0].sections) ? "Array" : "Object");
       console.log("Sample sections content (stringified length):", JSON.stringify(docs[0].sections).length);
       console.log("First doc name:", docs[0].name);
    } else {
       console.log("NO PRESENTATIONS FOUND IN DB");
    }
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
});
