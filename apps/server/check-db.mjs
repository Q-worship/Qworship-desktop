import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/qworship'); 

const coll = mongoose.connection.collection('presentations');
const docs = await coll.find({}).toArray();
console.log("Total presentations in DB:", docs.length);
if(docs.length > 0) {
    console.log("First doc name:", docs[0].name);
    console.log("First doc createdBy:", docs[0].createdBy);
    console.log("First doc Object keys:", Object.keys(docs[0]));
    console.log("sections is array?", Array.isArray(docs[0].sections), typeof docs[0].sections);
} else {
    console.log("NO PRESENTATIONS FOUND IN DB");
}
process.exit(0);
