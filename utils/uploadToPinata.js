const pinataSDK = require("@pinata/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY || "";
const pinataApiSecret = process.env.PINATA_API_SECRET || "";
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  let responses = [];
  for (fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

async function storeJSONMetadataFilesInPinata(jsonsFilePath) {
  const fullJsonPath = path.resolve(jsonsFilePath);
  const files = fs.readdirSync(fullJsonPath);
  let responses = [];
  for (fileIndex in files) {
    // convert json file into
    var jsonMetadata = JSON.parse(
      fs.readFileSync(fullJsonPath + "/" + files[fileIndex])
    );
    try {
      const response = await storeTokeUriMetadata(jsonMetadata);
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }

  console.log("responses: " + responses);
  return { responses };
}

async function storeTokeUriMetadata(metadata) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    // filter the ipfs hash and create the ipfs resource:
    const ipfsHash = response.IpfsHash;
    const uri = `ipfs://${ipfsHash}`;
    console.log("uri: " + uri);
    return uri;
  } catch (error) {
    console.log(error);
  }
  return null;
}

module.exports = {
  storeImages,
  storeTokeUriMetadata,
  storeJSONMetadataFilesInPinata,
};
