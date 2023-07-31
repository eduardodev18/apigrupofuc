const admin = require("firebase-admin");
const cors = require('cors');
const express = require("express");
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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


app.post('/generate-pdf', async (req, res) => {
  const { htmlContent } = req.body;
  const outputPath = './output.pdf';

  try {
    await generatePDFFromHTML(htmlContent, outputPath);
    
    // Lê o arquivo PDF gerado
    const pdfBuffer = fs.readFileSync(outputPath);

    // Define os cabeçalhos para permitir o download do PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');

    // Envia o conteúdo do PDF como resposta
    res.send(pdfBuffer);

    // Deleta o arquivo PDF gerado
    fs.unlinkSync(outputPath);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao gerar o PDF', error: error.message });
  }
});


async function generatePDFFromHTML(htmlContent, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Define o conteúdo HTML da página
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

  // Espera por um pequeno período de tempo (opcional) para garantir que o conteúdo seja carregado completamente.
  // Ajuste este valor de acordo com suas necessidades.
  await page.waitForTimeout(1000);

  // Gera o PDF com o conteúdo HTML
  await page.pdf({ path: outputPath, format: 'A4' });

  await browser.close();
  console.log('PDF gerado com sucesso!');
}


app.post('/generate-pdf', async (req, res) => {
  const { htmlContent } = req.body;
  const outputPath = './output.pdf';

  try {
    await generatePDFFromHTML(htmlContent, outputPath);
    
    // Lê o arquivo PDF gerado
    const pdfBuffer = fs.readFileSync(outputPath);

    // Define os cabeçalhos para permitir o download do PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');

    // Envia o conteúdo do PDF como resposta
    res.send(pdfBuffer);

    // Deleta o arquivo PDF gerado
    fs.unlinkSync(outputPath);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao gerar o PDF', error: error.message });
  }
});





app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});


