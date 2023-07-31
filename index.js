const admin = require("firebase-admin");
const cors = require('cors');
const express = require("express");
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const fs = require('fs')
const pdf = require('html-pdf');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 3001; // Escolha uma porta para sua API

const serviceAccount = require("./apigrupofuc-firebase-adminsdk-fslyg-07935fb606.json");

// EMAIL
const SibApiV3Sdk = require("sib-api-v3-sdk");
const sendinblueApiKey = process.env.SECRET_KEY;




const conteudoEmail = {
  assunto: "Inscrição EnFUC 2023",
  texto: "Olá, Você recebeu uma nova inscrição para o ENFUC",
  html: "<p>Olá, este é um <b>e-mail de teste</b> enviado pelo Node.js com Sendinblue!</p>",
};

// Configuração do cliente do Sendinblue
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = sendinblueApiKey;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://apigrupofuc-default-rtdb.firebaseio.com/", // URL do seu projeto Firebase (Realtime Database)
});

app.get("/dados", (req, res) => {
  const db = admin.database();
  const ref = db.ref("registros"); // Escolha uma pasta no Realtime Database

  ref
    .once("value")
    .then((snapshot) => {
      const data = snapshot.val();
      const dataArray = Object.values(data); // Transforma o objeto de objetos em um array de objetos
      res.json(dataArray);
    })
    .catch((error) => {
      res.status(500).json({ error: "Erro ao ler dados do Firebase" });
    });
});

app.post("/dados", (req, res) => {
  // Supondo que você recebe os dados em formato JSON no corpo da requisição
  const newData = req.body;

  const db = admin.database();
  const ref = db.ref("registros"); // Escolha uma pasta no Realtime Database

  ref
    .push(newData)
    .then(() => {
      res
        .status(201)
        .json({ message: "Dados adicionados com sucesso", data: newData });
    })
    .catch((error) => {
      res.status(500).json({ error: "Erro ao adicionar dados no Firebase" });
    });
});



const generatePDF = (req, res) => {
  const html = req.body.htmlContent; // Use req.body instead of res.body to access the request body.

  const options = {
    type: 'pdf',
    format: 'A4',
    orientation: 'portrait'
  };

  pdf.create(html, options).toBuffer((err, buffer) => {
    if (err) return res.status(500).json({ error: "Error generating PDF", message: err }); // Return an error response in case of an error.

    // Set the response headers to download the PDF as an attachment.
    res.set({
      'Content-Disposition': 'attachment; filename="generated.pdf"',
      'Content-Type': 'application/pdf',
    });

    res.end(buffer); // Send the PDF buffer in the response.
  });
};

app.post('/generate-pdf', generatePDF);






app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});


