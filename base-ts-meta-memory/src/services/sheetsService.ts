import { google } from "googleapis";
import { sheets_v4 } from "googleapis/build/src/apis/sheets";
import { config } from "../config";

class SheetManager {
    private sheets: sheets_v4.Sheets;
    private spreadsheetId: string;

    constructor(spreadsheetId: string, privateKey: string, clientEmail: string) {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                private_key: privateKey,
                client_email: clientEmail,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        this.sheets = google.sheets({ version: "v4", auth });
        this.spreadsheetId = spreadsheetId;
    }



    /* async function appendToSheet(values) {
             const sheets = google.sheets({ version: 'v4', auth }); // Create a Sheets API client instance
             const range = 'Sheet1!A1'; // The range in the sheet to start appending
             const valueInputOption = 'USER_ENTERED'; // How input data should be interpreted
         
             const resource = { values: values };
         
             try {
                 const res = await sheets.spreadsheets.values.append({
                     spreadsheetId,
                     range,
                     valueInputOption,
                     resource,
                 });
                 return res; // Returns the response from the Sheets API
             } catch (error) {
                 console.error('error', error); // Logs errors
             }
         }
         */



    // Función para verificar si un usuario existe
    async userExists(number: string): Promise<boolean> {
        try {
            const result = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Users!A:A', // Asumiendo que los números de teléfono están en la columna A
            });

            const rows = result.data.values;
            if (rows) {
                const numbers = rows.map(row => row[0]);
                return numbers.includes(number);
            }
            return false;
        } catch (error) {
            console.error("Error al verificar si el usuario exixte:", error);
            return false;
        }
    }

    // funcion para crear un usuario y una nueva pestaña

    async createUser(number: string, name: string, mail: string): Promise<void> {
        try {
            // agregar un usuario a la pestaña users
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Users!A:C',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[number, name, mail]],
                },
            });

            // Crear una nueva pestaña con el nombre del número de teléfono
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: number,
                                },
                            },
                        },
                    ],
                }
            });

        } catch (error) {
            console.error("Error al crear usuario o nueva pestaña:", error);
        }
    }

    // Función para obtener las preguntas/respuestas invertidas

    async getUserConv(number: string): Promise<any[]> {
        try {
            const result = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: '${number}!A:B',  // Asumiendo que las preguntas están en A y respuestas en B
            });

            const rows = result.data.values;
            if (!rows || rows.length === 0) {
                return [];
            }

            // Tomar las últimas preguntas/respuestas (hasta un máximo de 3) y revertir el orden
            const lastConversations = rows.slice(-3).reverse();

            // Formatear las respuestas en el formato solicitado
            const formattedConversations = [];
            for (let i = 0; i < lastConversations.length; i++) {
                const [userQuestion, assistantAnswer] = lastConversations[i];
                formattedConversations.push(
                    { role: "user", content: userQuestion },
                    { role: "assistant", content: assistantAnswer }
                );
            }

            return formattedConversations;
        } catch (error) {
            console.error("Error al obtener la conversación del usuario:", error);
            return [];
        }
    }

    // Función para agregar una conversación al inicio de la pestaña del usuario
    async addConverToUser(number: string, conversation: { role: string, content: string }[]): Promise<void> {
        try {
            const question = conversation.find(c => c.role === "user")?.content;
            const answer = conversation.find(c => c.role === "assistant")?.content;
            const date = new Date().toISOString(); //Fecha en formato UTC

            if (!question || !answer) {
                throw new Error("La conversación debe contener tanto una pregunta como una respuesta.");
            }

            // Leer las filas actuales para empujarlas hacia abajo
            const sheetData = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: '${number}!A:C',
            });

            const rows = sheetData.data.values || [];

            // Agregar la nueva conversación en la primera fila
            rows.unshift([question, answer, date]);

            // Escribir las filas de nuevo en la hoja
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: '${number}!A:C',
                valueInputOption: 'RAW',
                requestBody: {
                    values: rows,
                },
            });

        } catch (error) {
            console.error("Error al agregar la conversación:", error);
        }
    }
}
export default new SheetManager(
    config.spreadsheetId,
    config.privateKey,
    config.clientEmail,
);
