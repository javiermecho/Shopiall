import "dotenv/config";

export const config = {
    PORT: process.env.PORT ?? 3008,
    //Meta
    jwtToken: process.env.jwtToken,
    numberId: process.env.numberId,
    verifyToken: process.env.verifyToken,
    version: "v22.0",

    // chatgpt
    Model: process.env.Model,
    Apikeia: process.env.ApiKey,

    //sheet
    spreadsheetId: process.env.spreadsheetId,
    privateKey: process.env.privateKey,
    clientEmail: process.env.clientEmail

};